import { url as instanceUrl } from '../../config';

export function getStaticImageUrl(url: string): string {
	const u = new URL(url);
	const dummy = `${u.host}${u.pathname}`;	// 拡張子がないとキャッシュしてくれないCDNがあるので
	let result = `${instanceUrl}/proxy/${dummy}?url=${encodeURIComponent(u.href)}`;
	result += '&static=1';
	return result;
}
