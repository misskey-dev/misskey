const address = new URL(location.href);
const siteName = (document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement)?.content;

export const host = address.host;
export const hostname = address.hostname;
export const url = address.origin;
export const apiUrl = url + '/api';
export const wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://') + '/streaming';
export const lang = _LANG_;
export const langs = _LANGS_;
export const locale = _LOCALE_; // TODO: code splittingするため、翻訳ファイルを分割したうえでwebpackのimport alias使って読み込むようにしたい
export const version = _VERSION_;
export const instanceName = siteName === 'Misskey' ? host : siteName;
export const ui = localStorage.getItem('ui');
export const debug = localStorage.getItem('debug') === 'true';
