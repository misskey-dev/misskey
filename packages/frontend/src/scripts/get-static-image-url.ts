import { url as instanceUrl } from '@/config';
import * as url from '@/scripts/url';

export function getStaticImageUrl(baseUrl: string): string {
	const u = new URL(baseUrl);
	if (u.href.startsWith(`${instanceUrl}/proxy/`)) {
		// もう既にproxyっぽそうだったらsearchParams付けるだけ
		u.searchParams.set('static', '1');
		return u.href;
	}

	// 拡張子がないとキャッシュしてくれないCDNがあるのでダミーの名前を指定する
	const dummy = `${encodeURIComponent(`${u.host}${u.pathname}`)}.webp`;

	return `${instanceUrl}/proxy/${dummy}?${url.query({
		url: u.href,
		static: '1',
	})}`;
}
