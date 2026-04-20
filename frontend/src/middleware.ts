import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ENV } from "./configs/environment";
import { PATH } from "./shared/path";

const TOKEN_KEY = ENV.TOKEN_KEY;
// const JWT_SECRET = ENV.JWT_SCREET;

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const cookies = request.cookies.get(TOKEN_KEY);

	if (request.nextUrl.pathname === PATH.NOT_FOUND) {
		return NextResponse.next();
	}

	try {
		if (!cookies && pathname !== PATH.LOGIN) {
			const loginUrl = new URL(PATH.LOGIN, request.url);
			loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
			return NextResponse.redirect(loginUrl);
		}

		if (cookies && pathname === PATH.LOGIN) {
			return NextResponse.redirect(
				new URL(PATH.HOME, request.url),
			);
		}

		if (pathname === "/") {
			return NextResponse.redirect(
				new URL(PATH.HOME, request.url),
			);
		}

		return NextResponse.next();
	} catch {
		request.cookies.delete(TOKEN_KEY);
		return NextResponse.rewrite(new URL(PATH.NOT_FOUND, request.url));
	}
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)).*)",
	],
};