import { describe, expect, it } from "vitest";
import { buildCspHeader } from "./middleware";

describe("buildCspHeader", () => {
	it("scopes scripts to self plus the request nonce, never a blanket unsafe-inline", () => {
		const header = buildCspHeader("test-nonce-123");

		expect(header).toContain("script-src 'self' 'nonce-test-nonce-123' 'strict-dynamic'");
		expect(header).not.toContain("script-src 'self' 'unsafe-inline'");
	});

	it("blocks framing and plugin objects", () => {
		const header = buildCspHeader("n");

		expect(header).toContain("frame-ancestors 'none'");
		expect(header).toContain("object-src 'none'");
	});

	it("allows blob: for file-upload previews", () => {
		const header = buildCspHeader("n");

		expect(header).toContain("img-src 'self' blob: data:");
	});
});
