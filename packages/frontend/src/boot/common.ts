/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, watch, version as vueVersion } from 'vue';
import { compareVersions } from 'compare-versions';
import { version, lang, updateLocale, locale } from '@@/js/config.js';
import defaultLightTheme from '@@/themes/l-light.json5';
import defaultDarkTheme from '@@/themes/d-green-lime.json5';
import type { App } from 'vue';
import widgets from '@/widgets/index.js';
import directives from '@/directives/index.js';
import components from '@/components/index.js';
import { applyTheme } from '@/theme.js';
import { isDeviceDarkmode } from '@/utility/is-device-darkmode.js';
import { updateI18n, i18n } from '@/i18n.js';
import { refreshCurrentAccount, login } from '@/accounts.js';
import { store } from '@/store.js';
import { fetchInstance, instance } from '@/instance.js';
import { deviceKind, updateDeviceKind } from '@/utility/device-kind.js';
import { reloadChannel } from '@/utility/unison-reload.js';
import { getUrlWithoutLoginId } from '@/utility/login-id.js';
import { getAccountFromId } from '@/utility/get-account-from-id.js';
import { deckStore } from '@/ui/deck/deck-store.js';
import { analytics, initAnalytics } from '@/analytics.js';
import { miLocalStorage } from '@/local-storage.js';
import { fetchCustomEmojis } from '@/custom-emojis.js';
import { setupRouter } from '@/router/main.js';
import { createMainRouter } from '@/router/definition.js';
import { prefer } from '@/preferences.js';
import { $i } from '@/i.js';

export async function common(createVue: () => App<Element>) {
	console.info(`Misskey v${version}`);

	if (_DEV_) {
		console.warn('Development mode!!!');

		console.info(`vue ${vueVersion}`);

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

	let isClientUpdated = false;

	//#region クライアントが更新されたかチェック
	const lastVersion = miLocalStorage.getItem('lastVersion');
	if (lastVersion !== version) {
		miLocalStorage.setItem('lastVersion', version);

		// テーマリビルドするため
		miLocalStorage.removeItem('theme');

		try { // 変なバージョン文字列来るとcompareVersionsでエラーになるため
			if (lastVersion != null && compareVersions(version, lastVersion) === 1) {
				isClientUpdated = true;
			}
		} catch (err) { /* empty */ }
	}
	//#endregion

	//#region Detect language & fetch translations
	const localeVersion = miLocalStorage.getItem('localeVersion');
	const localeOutdated = (localeVersion == null || localeVersion !== version || locale == null);
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

	// URLに#pswpを含む場合は取り除く
	if (location.hash === '#pswp') {
		history.replaceState(null, '', location.href.replace('#pswp', ''));
	}

	// 一斉リロード
	reloadChannel.addEventListener('message', path => {
		if (path !== null) location.href = path;
		else location.reload();
	});

	// If mobile, insert the viewport meta tag
	if (['smartphone', 'tablet'].includes(deviceKind)) {
		const viewport = document.getElementsByName('viewport').item(0);
		viewport.setAttribute('content',
			`${viewport.getAttribute('content')}, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`);
	}

	//#region Set lang attr
	const html = document.documentElement;
	html.setAttribute('lang', lang);
	//#endregion

	await store.ready;
	await deckStore.ready;

	const fetchInstanceMetaPromise = fetchInstance();

	fetchInstanceMetaPromise.then(() => {
		miLocalStorage.setItem('v', instance.version);
	});

	//#region loginId
	const params = new URLSearchParams(location.search);
	const loginId = params.get('loginId');

	if (loginId) {
		const target = getUrlWithoutLoginId(location.href);

		if (!$i || $i.id !== loginId) {
			const account = await getAccountFromId(loginId);
			if (account) {
				await login(account.token, target);
			}
		}

		history.replaceState({ misskey: 'loginId' }, '', target);
	}
	//#endregion

	// NOTE: この処理は必ずクライアント更新チェック処理より後に来ること(テーマ再構築のため)
	watch(store.r.darkMode, (darkMode) => {
		applyTheme(darkMode
			? (prefer.s.darkTheme ?? defaultDarkTheme)
			: (prefer.s.lightTheme ?? defaultLightTheme),
		);
	}, { immediate: miLocalStorage.getItem('theme') == null });

	document.documentElement.dataset.colorScheme = store.s.darkMode ? 'dark' : 'light';

	const darkTheme = prefer.model('darkTheme');
	const lightTheme = prefer.model('lightTheme');

	watch(darkTheme, (theme) => {
		if (store.s.darkMode) {
			applyTheme(theme ?? defaultDarkTheme);
		}
	});

	watch(lightTheme, (theme) => {
		if (!store.s.darkMode) {
			applyTheme(theme ?? defaultLightTheme);
		}
	});

	//#region Sync dark mode
	if (prefer.s.syncDeviceDarkMode) {
		store.set('darkMode', isDeviceDarkmode());
	}

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (mql) => {
		if (prefer.s.syncDeviceDarkMode) {
			store.set('darkMode', mql.matches);
		}
	});
	//#endregion

	if (prefer.s.darkTheme && store.s.darkMode) {
		if (miLocalStorage.getItem('themeId') !== prefer.s.darkTheme.id) applyTheme(prefer.s.darkTheme);
	} else if (prefer.s.lightTheme && !store.s.darkMode) {
		if (miLocalStorage.getItem('themeId') !== prefer.s.lightTheme.id) applyTheme(prefer.s.lightTheme);
	}

	fetchInstanceMetaPromise.then(() => {
		// TODO: instance.defaultLightTheme/instance.defaultDarkThemeが不正な形式だった場合のケア
		if (prefer.s.lightTheme == null && instance.defaultLightTheme != null) prefer.commit('lightTheme', JSON.parse(instance.defaultLightTheme));
		if (prefer.s.darkTheme == null && instance.defaultDarkTheme != null) prefer.commit('darkTheme', JSON.parse(instance.defaultDarkTheme));
	});

	watch(prefer.r.overridedDeviceKind, (kind) => {
		updateDeviceKind(kind);
	}, { immediate: true });

	watch(prefer.r.useBlurEffectForModal, v => {
		document.documentElement.style.setProperty('--MI-modalBgFilter', v ? 'blur(4px)' : 'none');
	}, { immediate: true });

	watch(prefer.r.useBlurEffect, v => {
		if (v) {
			document.documentElement.style.removeProperty('--MI-blur');
		} else {
			document.documentElement.style.setProperty('--MI-blur', 'none');
		}
	}, { immediate: true });

	// Keep screen on
	const onVisibilityChange = () => document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') {
			navigator.wakeLock.request('screen');
		}
	});
	if (prefer.s.keepScreenOn && 'wakeLock' in navigator) {
		navigator.wakeLock.request('screen')
			.then(onVisibilityChange)
			.catch(() => {
				// On WebKit-based browsers, user activation is required to send wake lock request
				// https://webkit.org/blog/13862/the-user-activation-api/
				document.addEventListener(
					'click',
					() => navigator.wakeLock.request('screen').then(onVisibilityChange),
					{ once: true },
				);
			});
	}

	//#region Fetch user
	if ($i && $i.token) {
		if (_DEV_) {
			console.log('account cache found. refreshing...');
		}

		refreshCurrentAccount();
	}
	//#endregion

	try {
		await fetchCustomEmojis();
	} catch (err) { /* empty */ }

	// analytics
	fetchInstanceMetaPromise.then(async () => {
		await initAnalytics(instance);

		if ($i) {
			analytics.identify($i.id);
		}

		analytics.page({
			path: window.location.pathname,
		});
	});

	const app = createVue();

	setupRouter(app, createMainRouter);

	if (_DEV_) {
		app.config.performance = true;
	}

	widgets(app);
	directives(app);
	components(app);

	// https://github.com/misskey-dev/misskey/pull/8575#issuecomment-1114239210
	// なぜか2回実行されることがあるため、mountするdivを1つに制限する
	const rootEl = ((): HTMLElement => {
		const MISSKEY_MOUNT_DIV_ID = 'misskey_app';

		const currentRoot = document.getElementById(MISSKEY_MOUNT_DIV_ID);

		if (currentRoot) {
			console.warn('multiple import detected');
			return currentRoot;
		}

		const root = document.createElement('div');
		root.id = MISSKEY_MOUNT_DIV_ID;
		document.body.appendChild(root);
		return root;
	})();

	app.mount(rootEl);

	// boot.jsのやつを解除
	window.onerror = null;
	window.onunhandledrejection = null;

	removeSplash();

	//#region Self-XSS 対策メッセージ
	console.log(
		`%c${i18n.ts._selfXssPrevention.warning}`,
		'color: #f00; background-color: #ff0; font-size: 36px; padding: 4px;',
	);
	console.log(
		`%c${i18n.ts._selfXssPrevention.title}`,
		'color: #f00; font-weight: 900; font-family: "Hiragino Sans W9", "Hiragino Kaku Gothic ProN", sans-serif; font-size: 24px;',
	);
	console.log(
		`%c${i18n.ts._selfXssPrevention.description1}`,
		'font-size: 16px; font-weight: 700;',
	);
	console.log(
		`%c${i18n.ts._selfXssPrevention.description2}`,
		'font-size: 16px;',
		'font-size: 20px; font-weight: 700; color: #f00;',
	);
	console.log(i18n.tsx._selfXssPrevention.description3({ link: 'https://misskey-hub.net/docs/for-users/resources/self-xss/' }));
	//#endregion

	return {
		isClientUpdated,
		lastVersion,
		app,
	};
}

function removeSplash() {
	const splash = document.getElementById('splash');
	if (splash) {
		splash.style.opacity = '0';
		splash.style.pointerEvents = 'none';

		// transitionendイベントが発火しない場合があるため
		window.setTimeout(() => {
			splash.remove();
		}, 1000);
	}
}
