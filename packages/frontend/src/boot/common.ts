/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, watch, version as vueVersion, App } from 'vue';
import { compareVersions } from 'compare-versions';
import widgets from '@/widgets/index.js';
import directives from '@/directives/index.js';
import components from '@/components/index.js';
import { version, lang, updateLocale, locale } from '@/config.js';
import { applyTheme } from '@/scripts/theme.js';
import { isDeviceDarkmode } from '@/scripts/is-device-darkmode.js';
import { updateI18n, i18n } from '@/i18n.js';
import { $i, refreshAccount, login } from '@/account.js';
import { defaultStore, ColdDeviceStorage } from '@/store.js';
import { fetchInstance, instance } from '@/instance.js';
import { deviceKind } from '@/scripts/device-kind.js';
import { reloadChannel } from '@/scripts/unison-reload.js';
import { getUrlWithoutLoginId } from '@/scripts/login-id.js';
import { getAccountFromId } from '@/scripts/get-account-from-id.js';
import { deckStore } from '@/ui/deck/deck-store.js';
import { miLocalStorage } from '@/local-storage.js';
import { fetchCustomEmojis } from '@/custom-emojis.js';
import { setupRouter } from '@/router/definition.js';
import { mainRouter } from '@/router/main.js';
import VueGtag, { bootstrap as gtagBootstrap, GtagConsent, GtagConsentParams } from 'vue-gtag';

export async function common(createVue: () => App<Element>) {
	console.info(`Misskey v${version}`);

	if (_DEV_) {
		console.warn('Development mode!!!');

		console.info(`vue ${vueVersion}`);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).$i = $i;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(window as any).$store = defaultStore;

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

	if (miLocalStorage.getItem('id') === null) {
		miLocalStorage.setItem('id', crypto.randomUUID());
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

	await defaultStore.ready;
	await deckStore.ready;

	const fetchInstanceMetaPromise = fetchInstance();

	fetchInstanceMetaPromise.then(() => {
		miLocalStorage.setItem('v', instance.version);
	});

	const params = new URLSearchParams(location.search);
	//#region loginId
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

	//#region kawaii
	if (params.has('kawaii') || params.has('uwu')) {
		const v = params.get('kawaii') ?? params.get('uwu');
		if (v === 'false' || v === '0' || v === 'no' || v === 'off') {
			miLocalStorage.removeItem('kawaii');
		} else {
			miLocalStorage.setItem('kawaii', 'true');
		}
	}
	//#endregion

	// NOTE: この処理は必ずクライアント更新チェック処理より後に来ること(テーマ再構築のため)
	watch(defaultStore.reactiveState.darkMode, (darkMode) => {
		applyTheme(darkMode ? ColdDeviceStorage.get('darkTheme') : ColdDeviceStorage.get('lightTheme'));
		document.documentElement.dataset.colorMode = darkMode ? 'dark' : 'light';
	}, { immediate: miLocalStorage.getItem('theme') == null });

	document.documentElement.dataset.colorMode = defaultStore.state.darkMode ? 'dark' : 'light';

	const darkTheme = computed(ColdDeviceStorage.makeGetterSetter('darkTheme'));
	const lightTheme = computed(ColdDeviceStorage.makeGetterSetter('lightTheme'));

	watch(darkTheme, (theme) => {
		if (defaultStore.state.darkMode) {
			applyTheme(theme);
		}
	});

	watch(lightTheme, (theme) => {
		if (!defaultStore.state.darkMode) {
			applyTheme(theme);
		}
	});

	//#region Sync dark mode
	if (ColdDeviceStorage.get('syncDeviceDarkMode')) {
		defaultStore.set('darkMode', isDeviceDarkmode());
	}

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (mql) => {
		if (ColdDeviceStorage.get('syncDeviceDarkMode')) {
			defaultStore.set('darkMode', mql.matches);
		}
	});
	//#endregion

	fetchInstanceMetaPromise.then(() => {
		if (defaultStore.state.themeInitial) {
			if (instance.defaultLightTheme != null) ColdDeviceStorage.set('lightTheme', JSON.parse(instance.defaultLightTheme));
			if (instance.defaultDarkTheme != null) ColdDeviceStorage.set('darkTheme', JSON.parse(instance.defaultDarkTheme));
			defaultStore.set('themeInitial', false);
		} else {
			if (defaultStore.state.darkMode) {
				applyTheme(darkTheme.value);
			} else {
				applyTheme(lightTheme.value);
			}
		}
	});

	watch(defaultStore.reactiveState.useBlurEffectForModal, v => {
		document.documentElement.style.setProperty('--modalBgFilter', v ? 'blur(4px)' : 'none');
	}, { immediate: true });

	watch(defaultStore.reactiveState.useBlurEffect, v => {
		if (v) {
			document.documentElement.style.removeProperty('--blur');
		} else {
			document.documentElement.style.setProperty('--blur', 'none');
		}
	}, { immediate: true });

	// Keep screen on
	const onVisibilityChange = () => document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') {
			navigator.wakeLock.request('screen');
		}
	});
	if (defaultStore.state.keepScreenOn && 'wakeLock' in navigator) {
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

		refreshAccount();
	}
	//#endregion

	try {
		await fetchCustomEmojis();
	} catch (err) { /* empty */ }

	const app = createVue();

	setupRouter(app);

	if (_DEV_) {
		app.config.performance = true;
	}

	widgets(app);
	directives(app);
	components(app);

	if (instance.googleAnalyticsId) {
		app.use(VueGtag, {
			bootstrap: false,
			appName: `Misskey v${version}`,
			pageTrackerEnabled: true,
			pageTrackerScreenviewEnabled: true,
			config: {
				id: instance.googleAnalyticsId,
				params: {
					anonymize_ip: false,
					send_page_view: true,
				},
			},
		}, mainRouter);

		const gtagConsent = miLocalStorage.getItemAsJson('gtagConsent') as GtagConsentParams ?? {
			ad_storage: 'denied',
			ad_user_data: 'denied',
			ad_personalization: 'denied',
			analytics_storage: 'denied',
			functionality_storage: 'denied',
			personalization_storage: 'denied',
			security_storage: 'granted',
		};
		miLocalStorage.setItemAsJson('gtagConsent', gtagConsent);

		if (typeof window['gtag'] === 'function') (window['gtag'] as GtagConsent)('consent', 'default', gtagConsent);

		if (miLocalStorage.getItem('gaConsent') === 'true') {
			// noinspection ES6MissingAwait
			gtagBootstrap();
		}
	}

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
