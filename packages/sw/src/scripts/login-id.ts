export function getUrlWithLoginId(url: string, loginId: string) {
	const u = new URL(url, origin);
	u.searchParams.set('loginId', loginId);
	return u.toString();
}
