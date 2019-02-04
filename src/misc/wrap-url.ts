import { URL } from 'url';
import config from '../config';
import { urlQuery } from '../prelude/string';

/**
 * avatar, thumbnail, custom-emoji 等のURLをクライアント設定等によって置き換える
 */
export default function(url: string, me: any) {
	if (url == null) return url;

	// アニメーション再生無効
	if (me && me.clientSettings && me.clientSettings.doNotAutoplayAnimation) {
		const u = new URL(url);
		const dummy = `${u.host}${u.pathname}`;	// 拡張子がないとキャッシュしてくれないCDNがあるので
		return `${config.url}/proxy/${dummy}?${urlQuery({
			url: encodeURI(u.href),
			static: 1
		})}`;
	}

	return url;
}
