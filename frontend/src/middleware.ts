import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ENV } from "./configs/environment";
import { PATH } from "./shared/path";

const TOKEN_KEY = ENV.TOKEN_KEY;
// const JWT_SECRET = ENV.JWT_SCREET;

const apiOrigin = (() => {
	const apiUrl =
		process.env.NEXT_PUBLIC_RUN_MODE === "development"
			? process.env.NEXT_PUBLIC_API_URL_DEV
			: process.env.NEXT_PUBLIC_API_URL_PROD;

	try {
		return apiUrl ? new URL(apiUrl).origin : "";
	} catch {
		return "";
	}
})();

export function buildCspHeader(nonce: string): string {
	// Next.js dev mode's HMR/React-Refresh runtime evals code — only needed for `next dev`,
	// never for a production build, so keep the strict CSP everywhere else.
	const isDev = process.env.NODE_ENV === "development";
	const scriptSrc = isDev
		? `script-src 'self' 'unsafe-eval' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com`
		: `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com`;

	return [
		"default-src 'self'",
		scriptSrc,
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' blob: data:",
		"font-src 'self'",
		`connect-src 'self' ${apiOrigin} https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com`,
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
	].join("; ");
}

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const cookies = request.cookies.get(TOKEN_KEY);

	const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
	const cspHeader = buildCspHeader(nonce);

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-nonce", nonce);
	requestHeaders.set("Content-Security-Policy", cspHeader);

	const applyCsp = (response: NextResponse): NextResponse => {
		response.headers.set("Content-Security-Policy", cspHeader);
		return response;
	};

	if (request.nextUrl.pathname === PATH.NOT_FOUND) {
		return applyCsp(NextResponse.next({ request: { headers: requestHeaders } }));
	}

	try {
		if (!cookies && pathname !== PATH.LOGIN) {
			const loginUrl = new URL(PATH.LOGIN, request.url);
			loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
			return applyCsp(NextResponse.redirect(loginUrl));
		}

		if (cookies && pathname === PATH.LOGIN) {
			return applyCsp(NextResponse.redirect(new URL(PATH.HOME, request.url)));
		}

		if (pathname === "/") {
			return applyCsp(NextResponse.redirect(new URL(PATH.HOME, request.url)));
		}

		return applyCsp(NextResponse.next({ request: { headers: requestHeaders } }));
	} catch {
		request.cookies.delete(TOKEN_KEY);
		return applyCsp(NextResponse.rewrite(new URL(PATH.NOT_FOUND, request.url)));
	}
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)).*)",
	],
};