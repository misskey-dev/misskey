import { query, appendQuery } from '@/scripts/url';
import { url } from '@/config';

export function getProxiedImageUrl(imageUrl: string, type?: 'preview'): string {
	if (imageUrl.startsWith(`${url}/proxy/`) || imageUrl.startsWith('/proxy/')) {
		// もう既にproxyっぽそうだったらsearchParams付けるだけ
		return appendQuery(imageUrl, query({
			fallback: '1',
			...(type ? { [type]: '1' } : {}),
		}));
	}

	return `${url}/proxy/image.webp?${query({
		url: imageUrl,
		fallback: '1',
		...(type ? { [type]: '1' } : {}),
	})}`;
}

export function getProxiedImageUrlNullable(imageUrl: string | null | undefined, type?: 'preview'): string | null {
	if (imageUrl == null) return null;
	return getProxiedImageUrl(imageUrl, type);
}

export function getStaticImageUrl(baseUrl: string): string {
	const u = baseUrl.startsWith('http') ? new URL(baseUrl) : new URL(baseUrl, url);

	if (u.href.startsWith(`${url}/proxy/`)) {
		// もう既にproxyっぽそうだったらsearchParams付けるだけ
		u.searchParams.set('static', '1');
		return u.href;
	}

	if (u.href.startsWith(`${url}/emoji/`)) {
		// もう既にemojiっぽそうだったらsearchParams付けるだけ
		u.searchParams.set('static', '1');
		return u.href;
	}

	// 拡張子がないとキャッシュしてくれないCDNがあるのでダミーの名前を指定する
	const dummy = `${encodeURIComponent(`${u.host}${u.pathname}`)}.webp`;

	return `${url}/proxy/${dummy}?${query({
		url: u.href,
		static: '1',
	})}`;
}
