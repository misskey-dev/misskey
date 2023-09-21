/**
 * Client entry point
 */
// https://vitejs.dev/config/build-options.html#build-modulepreload
import 'vite/modulepreload-polyfill';

import '@/style.scss';

import { computed, createApp, watch, markRaw, version as vueVersion, defineAsyncComponent } from 'vue';
import { compareVersions } from 'compare-versions';
import JSON5 from 'json5';

import widgets from '@/widgets';
import directives from '@/directives';
import components from '@/components';
import { version, ui, lang, updateLocale } from '@/config';
import { applyTheme } from '@/scripts/theme';
import { isDeviceDarkmode } from '@/scripts/is-device-darkmode';
import { i18n, updateI18n } from '@/i18n';
import { confirm, alert, post, popup, toast } from '@/os';
import { stream } from '@/stream';
import * as sound from '@/scripts/sound';
import { $i, refreshAccount, login, updateAccount, signout } from '@/account';
import { defaultStore, ColdDeviceStorage } from '@/store';
import { fetchInstance, instance } from '@/instance';
import { makeHotkey } from '@/scripts/hotkey';
import { deviceKind } from '@/scripts/device-kind';
import { initializeSw } from '@/scripts/initialize-sw';
import { reloadChannel } from '@/scripts/unison-reload';
import { reactionPicker } from '@/scripts/reaction-picker';
import { getUrlWithoutLoginId } from '@/scripts/login-id';
import { getAccountFromId } from '@/scripts/get-account-from-id';
import { deckStore } from '@/ui/deck/deck-store';
import { miLocalStorage } from '@/local-storage';
import { claimAchievement, claimedAchievements } from '@/scripts/achievements';
import { fetchCustomEmojis } from '@/custom-emojis';
import { mainRouter } from '@/router';

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

//#region Fetch user
if ($i && $i.token) {
	if (_DEV_) {
		console.log('account cache found. refreshing...');
	}

	refreshAccount();
} else {
	if (_DEV_) {
		console.log('no account cache found.');
	}

	// 連携ログインの場合用にCookieを参照する
	const i = (document.cookie.match(/igi=(\w+)/) ?? [null, null])[1];

	if (i != null && i !== 'null') {
		if (_DEV_) {
			console.log('signing...');
		}

		try {
			document.body.innerHTML = '<div>Please wait...</div>';
			await login(i);
		} catch (err) {
			// Render the error screen
			// TODO: ちゃんとしたコンポーネントをレンダリングする(v10とかのトラブルシューティングゲーム付きのやつみたいな)
			document.body.innerHTML = '<div id="err">Oops!</div>';
		}
	} else {
		if (_DEV_) {
			console.log('not signed in');
		}
	}
}
//#endregion

const fetchInstanceMetaPromise = fetchInstance();

fetchInstanceMetaPromise.then(() => {
	miLocalStorage.setItem('v', instance.version);

	// Init service worker
	initializeSw();
});

try {
	await fetchCustomEmojis();
} catch (err) { /* empty */ }

const app = createApp(
	new URLSearchParams(window.location.search).has('zen') ? defineAsyncComponent(() => import('@/ui/zen.vue')) :
	!$i ? defineAsyncComponent(() => import('@/ui/visitor.vue')) :
	ui === 'deck' ? defineAsyncComponent(() => import('@/ui/deck.vue')) :
	ui === 'classic' ? defineAsyncComponent(() => import('@/ui/classic.vue')) :
	defineAsyncComponent(() => import('@/ui/universal.vue')),
);

if (_DEV_) {
	app.config.performance = true;
}

widgets(app);
directives(app);
components(app);

const splash = document.getElementById('splash');
// 念のためnullチェック(HTMLが古い場合があるため(そのうち消す))
if (splash) splash.addEventListener('transitionend', () => {
	splash.remove();
});

await deckStore.ready;

// https://github.com/misskey-dev/misskey/pull/8575#issuecomment-1114239210
// なぜかinit.tsの内容が2回実行されることがあるため、mountするdivを1つに制限する
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

reactionPicker.init();

if (splash) {
	splash.style.opacity = '0';
	splash.style.pointerEvents = 'none';
}

// クライアントが更新されたか？
const lastVersion = miLocalStorage.getItem('lastVersion');
if (lastVersion !== version) {
	miLocalStorage.setItem('lastVersion', version);

	// テーマリビルドするため
	miLocalStorage.removeItem('theme');

	try { // 変なバージョン文字列来るとcompareVersionsでエラーになるため
		if (lastVersion != null && compareVersions(version, lastVersion) === 1) {
			// ログインしてる場合だけ
			if ($i) {
				popup(defineAsyncComponent(() => import('@/components/MkUpdated.vue')), {}, {}, 'closed');
			}
		}
	} catch (err) { /* empty */ }
}

await defaultStore.ready;

// NOTE: この処理は必ず↑のクライアント更新時処理より後に来ること(テーマ再構築のため)
watch(defaultStore.reactiveState.darkMode, (darkMode) => {
	applyTheme(darkMode ? ColdDeviceStorage.get('darkTheme') : ColdDeviceStorage.get('lightTheme'));
}, { immediate: miLocalStorage.getItem('theme') == null });

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

window.matchMedia('(prefers-color-scheme: dark)').addListener(mql => {
	if (ColdDeviceStorage.get('syncDeviceDarkMode')) {
		defaultStore.set('darkMode', mql.matches);
	}
});
//#endregion

fetchInstanceMetaPromise.then(() => {
	if (defaultStore.state.themeInitial) {
		if (instance.defaultLightTheme != null) ColdDeviceStorage.set('lightTheme', JSON5.parse(instance.defaultLightTheme));
		if (instance.defaultDarkTheme != null) ColdDeviceStorage.set('darkTheme', JSON5.parse(instance.defaultDarkTheme));
		defaultStore.set('themeInitial', false);
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

let reloadDialogShowing = false;
stream.on('_disconnected_', async () => {
	if (defaultStore.state.serverDisconnectedBehavior === 'reload') {
		location.reload();
	} else if (defaultStore.state.serverDisconnectedBehavior === 'dialog') {
		if (reloadDialogShowing) return;
		reloadDialogShowing = true;
		const { canceled } = await confirm({
			type: 'warning',
			title: i18n.ts.disconnectedFromServer,
			text: i18n.ts.reloadConfirm,
		});
		reloadDialogShowing = false;
		if (!canceled) {
			location.reload();
		}
	}
});

for (const plugin of ColdDeviceStorage.get('plugins').filter(p => p.active)) {
	import('./plugin').then(async ({ install }) => {
		// Workaround for https://bugs.webkit.org/show_bug.cgi?id=242740
		await new Promise(r => setTimeout(r, 0));
		install(plugin);
	});
}

const hotkeys = {
	'd': (): void => {
		defaultStore.set('darkMode', !defaultStore.state.darkMode);
	},
	's': (): void => {
		mainRouter.push('/search');
	},
};

if ($i) {
	// only add post shortcuts if logged in
	hotkeys['p|n'] = post;

	if ($i.isDeleted) {
		alert({
			type: 'warning',
			text: i18n.ts.accountDeletionInProgress,
		});
	}

	const now = new Date();
	const m = now.getMonth() + 1;
	const d = now.getDate();
	
	if ($i.birthday) {
		const bm = parseInt($i.birthday.split('-')[1]);
		const bd = parseInt($i.birthday.split('-')[2]);
		if (m === bm && d === bd) {
			claimAchievement('loggedInOnBirthday');
		}
	}

	if (m === 1 && d === 1) {
		claimAchievement('loggedInOnNewYearsDay');
	}

	if ($i.loggedInDays >= 3) claimAchievement('login3');
	if ($i.loggedInDays >= 7) claimAchievement('login7');
	if ($i.loggedInDays >= 15) claimAchievement('login15');
	if ($i.loggedInDays >= 30) claimAchievement('login30');
	if ($i.loggedInDays >= 60) claimAchievement('login60');
	if ($i.loggedInDays >= 100) claimAchievement('login100');
	if ($i.loggedInDays >= 200) claimAchievement('login200');
	if ($i.loggedInDays >= 300) claimAchievement('login300');
	if ($i.loggedInDays >= 400) claimAchievement('login400');
	if ($i.loggedInDays >= 500) claimAchievement('login500');
	if ($i.loggedInDays >= 600) claimAchievement('login600');
	if ($i.loggedInDays >= 700) claimAchievement('login700');
	if ($i.loggedInDays >= 800) claimAchievement('login800');
	if ($i.loggedInDays >= 900) claimAchievement('login900');
	if ($i.loggedInDays >= 1000) claimAchievement('login1000');

	if ($i.notesCount > 0) claimAchievement('notes1');
	if ($i.notesCount >= 10) claimAchievement('notes10');
	if ($i.notesCount >= 100) claimAchievement('notes100');
	if ($i.notesCount >= 500) claimAchievement('notes500');
	if ($i.notesCount >= 1000) claimAchievement('notes1000');
	if ($i.notesCount >= 5000) claimAchievement('notes5000');
	if ($i.notesCount >= 10000) claimAchievement('notes10000');
	if ($i.notesCount >= 20000) claimAchievement('notes20000');
	if ($i.notesCount >= 30000) claimAchievement('notes30000');
	if ($i.notesCount >= 40000) claimAchievement('notes40000');
	if ($i.notesCount >= 50000) claimAchievement('notes50000');
	if ($i.notesCount >= 60000) claimAchievement('notes60000');
	if ($i.notesCount >= 70000) claimAchievement('notes70000');
	if ($i.notesCount >= 80000) claimAchievement('notes80000');
	if ($i.notesCount >= 90000) claimAchievement('notes90000');
	if ($i.notesCount >= 100000) claimAchievement('notes100000');

	if ($i.followersCount > 0) claimAchievement('followers1');
	if ($i.followersCount >= 10) claimAchievement('followers10');
	if ($i.followersCount >= 50) claimAchievement('followers50');
	if ($i.followersCount >= 100) claimAchievement('followers100');
	if ($i.followersCount >= 300) claimAchievement('followers300');
	if ($i.followersCount >= 500) claimAchievement('followers500');
	if ($i.followersCount >= 1000) claimAchievement('followers1000');

	if (Date.now() - new Date($i.createdAt).getTime() > 1000 * 60 * 60 * 24 * 365) {
		claimAchievement('passedSinceAccountCreated1');
	}
	if (Date.now() - new Date($i.createdAt).getTime() > 1000 * 60 * 60 * 24 * 365 * 2) {
		claimAchievement('passedSinceAccountCreated2');
	}
	if (Date.now() - new Date($i.createdAt).getTime() > 1000 * 60 * 60 * 24 * 365 * 3) {
		claimAchievement('passedSinceAccountCreated3');
	}

	if (claimedAchievements.length >= 30) {
		claimAchievement('collectAchievements30');
	}

	window.setInterval(() => {
		if (Math.floor(Math.random() * 20000) === 0) {
			claimAchievement('justPlainLucky');
		}
	}, 1000 * 10);

	window.setTimeout(() => {
		claimAchievement('client30min');
	}, 1000 * 60 * 30);

	const lastUsed = miLocalStorage.getItem('lastUsed');
	if (lastUsed) {
		const lastUsedDate = parseInt(lastUsed, 10);
		// 二時間以上前なら
		if (Date.now() - lastUsedDate > 1000 * 60 * 60 * 2) {
			toast(i18n.t('welcomeBackWithName', {
				name: $i.name || $i.username,
			}));
		}
	}
	miLocalStorage.setItem('lastUsed', Date.now().toString());

	const latestDonationInfoShownAt = miLocalStorage.getItem('latestDonationInfoShownAt');
	const neverShowDonationInfo = miLocalStorage.getItem('neverShowDonationInfo');
	if (neverShowDonationInfo !== 'true' && (new Date($i.createdAt).getTime() < (Date.now() - (1000 * 60 * 60 * 24 * 3)))) {
		if (latestDonationInfoShownAt == null || (new Date(latestDonationInfoShownAt).getTime() < (Date.now() - (1000 * 60 * 60 * 24 * 30)))) {
			popup(defineAsyncComponent(() => import('@/components/MkDonation.vue')), {}, {}, 'closed');
		}
	}

	if ('Notification' in window) {
		// 許可を得ていなかったらリクエスト
		if (Notification.permission === 'default') {
			Notification.requestPermission();
		}
	}

	const main = markRaw(stream.useChannel('main', null, 'System'));

	// 自分の情報が更新されたとき
	main.on('meUpdated', i => {
		updateAccount(i);
	});

	main.on('readAllNotifications', () => {
		updateAccount({ hasUnreadNotification: false });
	});

	main.on('unreadNotification', () => {
		updateAccount({ hasUnreadNotification: true });
	});

	main.on('unreadMention', () => {
		updateAccount({ hasUnreadMentions: true });
	});

	main.on('readAllUnreadMentions', () => {
		updateAccount({ hasUnreadMentions: false });
	});

	main.on('unreadSpecifiedNote', () => {
		updateAccount({ hasUnreadSpecifiedNotes: true });
	});

	main.on('readAllUnreadSpecifiedNotes', () => {
		updateAccount({ hasUnreadSpecifiedNotes: false });
	});

	main.on('readAllAntennas', () => {
		updateAccount({ hasUnreadAntenna: false });
	});

	main.on('unreadAntenna', () => {
		updateAccount({ hasUnreadAntenna: true });
		sound.play('antenna');
	});

	main.on('readAllAnnouncements', () => {
		updateAccount({ hasUnreadAnnouncement: false });
	});

	// トークンが再生成されたとき
	// このままではMisskeyが利用できないので強制的にサインアウトさせる
	main.on('myTokenRegenerated', () => {
		signout();
	});
}

// shortcut
document.addEventListener('keydown', makeHotkey(hotkeys));
