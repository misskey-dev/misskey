export function getUrlWithLoginId(url: string, loginId: string): string {
	const u = new URL(url, origin);
	u.searchParams.set('loginId', loginId);
	return u.toString();
}
