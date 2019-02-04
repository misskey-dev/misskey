import { url as instanceUrl } from '../../config';
import { urlQuery } from '../../../../prelude/string';

export function getStaticImageUrl(url: string): string {
	const u = new URL(url);
	const dummy = `${u.host}${u.pathname}`;	// 拡張子がないとキャッシュしてくれないCDNがあるので
	return `${instanceUrl}/proxy/${dummy}?${urlQuery({
		url: u.href,
		static: '1'
	})}`;
}
