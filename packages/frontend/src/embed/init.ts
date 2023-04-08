import { miLocalStorage } from '@/local-storage';
import { version, lang, updateLocale } from '@/config';
import { updateI18n } from '@/i18n';
import { embedInitI18n } from './scripts/embed-i18n';
import '@/style.scss';
import './embed.scss';
import 'iframe-resizer/js/iframeResizer.contentWindow';
import { embedInitLinkAnime } from './scripts/link-anime';
import { parseMfm } from './scripts/parse-mfm';

console.info(`Misskey (Embed Sandbox) v${version}`);

if (_DEV_) {
	console.warn('Development mode!!!');

	window.addEventListener('error', event => {
		console.error(event);
		/*
		alert({
			type: 'error',
			title: 'DEV: Unhandled error',
			text: event.message
		});
		*/
	});

	window.addEventListener('unhandledrejection', event => {
		console.error(event);
		/*
		alert({
			type: 'error',
			title: 'DEV: Unhandled promise rejection',
			text: event.reason
		});
		*/
	});
}

//#region Detect language & fetch translations
const localeVersion = miLocalStorage.getItem('localeVersion');
const localeOutdated = (localeVersion == null || localeVersion !== version);
if (localeOutdated) {
	const res = await window.fetch(`/assets/locales/${lang}.${version}.json`);
	if (res.status === 200) {
		const newLocale = await res.text();
		const parsedNewLocale = JSON.parse(newLocale);
		miLocalStorage.setItem('locale', newLocale);
		miLocalStorage.setItem('localeVersion', version);
		updateLocale(parsedNewLocale);
		updateI18n(parsedNewLocale);
	}
}
//#endregion

// タッチデバイスでCSSの:hoverを機能させる
document.addEventListener('touchend', () => {}, { passive: true });

//#region Set lang attr
const html = document.documentElement;
html.setAttribute('lang', lang);
//#endregion

embedInitI18n();

document.querySelectorAll(".mfm").forEach((e) => {
	e.innerHTML = parseMfm(e.innerHTML).outerHTML;
});

//#region ロード画面解除
const splash = document.getElementById('splash');
// 念のためnullチェック(HTMLが古い場合があるため(そのうち消す))
if (splash) splash.addEventListener('transitionend', () => {
	splash.remove();
});

if (splash) {
	splash.style.opacity = '0';
	splash.style.pointerEvents = 'none';
}
//#endregion

embedInitLinkAnime();
