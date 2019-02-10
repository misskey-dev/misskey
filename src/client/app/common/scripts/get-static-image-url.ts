import { url as instanceUrl } from '../../config';
import * as url from '../../../../prelude/url';

export function getStaticImageUrl(baseUrl: string): string {
	const u = new URL(baseUrl);
	const dummy = `${u.host}${u.pathname}`;	// 拡張子がないとキャッシュしてくれないCDNがあるので
	return `${instanceUrl}/proxy/${dummy}?${url.query({
		url: u.href,
		static: '1'
	})}`;
}
