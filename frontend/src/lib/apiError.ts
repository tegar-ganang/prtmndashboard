// Backend returns 403 for RBAC denials (wrong role for the menu/action) — surface that
// distinctly instead of the same generic "failed" message as a validation/server error.
export function getApiErrorMessage(statusCode: number, kind: unknown, fallback: string): string {
	if (statusCode === 403) {
		return "Anda tidak memiliki izin untuk melakukan aksi ini.";
	}

	const body = kind as { err?: string; message?: string } | null | undefined;
	return body?.err ?? body?.message ?? fallback;
}
