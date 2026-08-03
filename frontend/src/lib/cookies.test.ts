import { beforeEach, describe, expect, it, vi } from "vitest";

const setMock = vi.fn();

vi.mock("universal-cookie", () => ({
	default: class {
		set = setMock;
		get = vi.fn();
		remove = vi.fn();
	},
}));

vi.mock("@/configs/environment", () => ({
	ENV: { MODE: "development", TOKEN_KEY: "@test/token" },
}));

describe("setToken", () => {
	beforeEach(() => {
		setMock.mockClear();
	});

	it("does not mark the cookie secure outside production", async () => {
		const { setToken } = await import("./cookies");
		setToken("abc123");

		expect(setMock).toHaveBeenCalledWith(
			"@test/token",
			"abc123",
			expect.objectContaining({ secure: false, sameSite: "lax" }),
		);
	});

	it("marks the cookie secure in production", async () => {
		vi.resetModules();
		const env = await import("@/configs/environment");
		(env.ENV as { MODE: string }).MODE = "production";

		const { setToken } = await import("./cookies");
		setToken("abc123");

		expect(setMock).toHaveBeenCalledWith(
			"@test/token",
			"abc123",
			expect.objectContaining({ secure: true, sameSite: "lax" }),
		);

		(env.ENV as { MODE: string }).MODE = "development";
	});
});
