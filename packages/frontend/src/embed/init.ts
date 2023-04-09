/**
 * Client (Embed) entry point
 */
import 'vite/modulepreload-polyfill';
import { miLocalStorage } from '@/local-storage';
import { version, lang, updateLocale, url } from '@/config';
import { embedInitI18n } from './scripts/embed-i18n';
import '@/style.scss';
import './embed.scss';
import 'iframe-resizer/js/iframeResizer.contentWindow';
import { parseMfm } from './scripts/parse-mfm';
import { renderNotFound } from './scripts/render-not-found';
import { parseEmoji } from './scripts/parse-emoji';
import { applyTheme } from '@/scripts/theme';
import lightTheme from '@/themes/_light.json5';
import darkTheme from '@/themes/_dark.json5';
import { isDeviceDarkmode } from '@/scripts/is-device-darkmode';

console.info(`Misskey (Embed) v${version}`);

const supportedEmbedEntity: string[] = [
	'notes'
];

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
		embedInitI18n();
	}
}
//#endregion

// タッチデバイスでCSSの:hoverを機能させる
document.addEventListener('touchend', () => {}, { passive: true });

//#region Set lang attr
const html = document.documentElement;
html.setAttribute('lang', lang);
//#endregion

//#region ページのパスをパース
// パス構造: /{entityName}/{id}/embed
const path = location.pathname;
if (!path.includes('/embed')) {
	location.href = url;
	throw new Error('Embed script was loaded on non-embed page. Force redirect to the top page.');
}
const pageMetaValues:string[] = path.split('/').filter((dir) => dir !== '' && dir !== 'embed');
const pageMeta: { entityName: string; id: string; } = {
	entityName: pageMetaValues[0],
	id: pageMetaValues[1],
};
const URLParams = new URLSearchParams(location.search);
const enableAnimatedMfm = URLParams.get("mfm") === 'animated';
const disableRootRound = URLParams.get("rounded") === "0";
//#endregion

const rootEl = document.getElementById("container");
if (disableRootRound && rootEl) {
	rootEl.style.borderRadius = "0";
}

//#region テーマ適用
const themePreferences = localStorage.getItem('theme');
const getTheme = async () => {
	// テーマが指定されている場合
	if (URLParams.has("theme")) {
		switch (URLParams.get("theme")) {
			case 'light':
				return lightTheme;
			case 'dark':
				return darkTheme;
			default:
				return await import(`../themes/${URLParams.get("theme")}.json5`).catch((_) => {
					return isDeviceDarkmode() ? darkTheme : lightTheme;
				});
		}	
	} else {
		return isDeviceDarkmode() ? darkTheme : lightTheme;
	}
};

if (!themePreferences || URLParams.has("theme")) {
	applyTheme(await getTheme(), false);
}
//#endregion

//埋め込みページごとのスクリプト読み込み
if (!supportedEmbedEntity.includes(pageMeta.entityName)) {
	renderNotFound();
	afterPageInitialization();
} else {
	import(`./pages/${pageMeta.entityName}.ts`).then(() => {
		afterPageInitialization();
	});
}

function afterPageInitialization() {
	embedInitI18n();
	
	//@ts-ignore
	document.querySelectorAll(".mfm").forEach((el: HTMLElement) => {
		el.innerHTML = parseMfm(el.innerText, enableAnimatedMfm).outerHTML;
	});
	
	parseEmoji();

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
}
