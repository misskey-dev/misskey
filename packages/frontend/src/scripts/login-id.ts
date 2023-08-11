export function getUrlWithLoginId(url: string, loginId: string) {
	const u = new URL(url, origin);
	u.searchParams.append('loginId', loginId);
	return u.toString();
}

export function getUrlWithoutLoginId(url: string) {
	const u = new URL(url);
	u.searchParams.delete('loginId');
	return u.toString();
}
