/**
 * Client entry point
 */

import '@/style.scss';

import { set } from 'idb-keyval';

// TODO: そのうち消す
if (localStorage.getItem('vuex') != null) {
	const vuex = JSON.parse(localStorage.getItem('vuex'));

	localStorage.setItem('account', JSON.stringify({
		...vuex.i,
		token: localStorage.getItem('i')
	}));
	set('accounts', JSON.parse(JSON.stringify(vuex.device.accounts)));
	localStorage.setItem('miux:themes', JSON.stringify(vuex.device.themes));

	for (const [k, v] of 	Object.entries(vuex.device.userData)) {
		localStorage.setItem('pizzax::base::' + k, JSON.stringify({
			widgets: v.widgets
		}));

		if (v.deck) {
			localStorage.setItem('pizzax::deck::' + k, JSON.stringify({
				columns: v.deck.columns,
				layout: v.deck.layout,
			}));
		}
	}

	localStorage.setItem('vuex-old', JSON.stringify(vuex));
	localStorage.removeItem('vuex');
	localStorage.removeItem('i');
	localStorage.removeItem('locale');

	location.reload();
}

if (localStorage.getItem('accounts') != null) {
	set('accounts', JSON.parse(localStorage.getItem('accounts')));
	localStorage.removeItem('accounts');
}

import * as Sentry from '@sentry/browser';
import { Integrations } from '@sentry/tracing';
import { createApp, toRaw, watch } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import widgets from '@/widgets';
import directives from '@/directives';
import components from '@/components';
import { version, ui, lang, host } from '@/config';
import { router } from '@/router';
import { applyTheme } from '@/scripts/theme';
import { isDeviceDarkmode } from '@/scripts/is-device-darkmode';
import { i18n } from '@/i18n';
import { stream, dialog, post } from '@/os';
import * as sound from '@/scripts/sound';
import { $i, refreshAccount, login, updateAccount, signout } from '@/account';
import { defaultStore, ColdDeviceStorage } from '@/store';
import { fetchInstance, instance } from '@/instance';
import { makeHotkey } from '@/scripts/hotkey';
import { search } from '@/scripts/search';
import { isMobile } from '@/scripts/is-mobile';
import { getThemes } from '@/theme-store';
import { initializeSw } from '@/scripts/initialize-sw';
import { reloadChannel } from '@/scripts/unison-reload';
import { deleteLoginId } from '@/scripts/login-id';
import { getAccountFromId } from '@/scripts/get-account-from-id';

console.info(`Misskey v${version}`);

// boot.jsのやつを解除
window.onerror = null;

if (_DEV_) {
	console.warn('Development mode!!!');

	(window as any).$i = $i;
	(window as any).$store = defaultStore;

	window.addEventListener('error', event => {
		console.error(event);
		/*
		dialog({
			type: 'error',
			title: 'DEV: Unhandled error',
			text: event.message
		});
		*/
	});

	window.addEventListener('unhandledrejection', event => {
		console.error(event);
		/*
		dialog({
			type: 'error',
			title: 'DEV: Unhandled promise rejection',
			text: event.reason
		});
		*/
	});
}

if (defaultStore.state.reportError && !_DEV_) {
	Sentry.init({
		dsn: 'https://fd273254a07a4b61857607a9ea05d629@o501808.ingest.sentry.io/5583438',
		tracesSampleRate: 1.0,
	});

	Sentry.setTag('misskey_version', version);
	Sentry.setTag('ui', ui);
	Sentry.setTag('lang', lang);
	Sentry.setTag('host', host);
}

// タッチデバイスでCSSの:hoverを機能させる
document.addEventListener('touchend', () => {}, { passive: true });

// 一斉リロード
reloadChannel.addEventListener('message', () => location.reload());

//#region SEE: https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
// TODO: いつの日にか消したい
const vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);
window.addEventListener('resize', () => {
	const vh = window.innerHeight * 0.01;
	document.documentElement.style.setProperty('--vh', `${vh}px`);
});
//#endregion

// Get the <head> element
const head = document.getElementsByTagName('head')[0];

// If mobile, insert the viewport meta tag
if (isMobile || window.innerWidth <= 1024) {
	const viewport = document.getElementsByName('viewport').item(0);
	viewport.setAttribute('content',
		`${viewport.getAttribute('content')},minimum-scale=1,maximum-scale=1,user-scalable=no`);
	head.appendChild(viewport);
}

//#region Set lang attr
const html = document.documentElement;
html.setAttribute('lang', lang);
//#endregion

//#region loginId
const params = new URLSearchParams(location.href);
const loginId = params.get('loginId');

if (loginId) {
	const target = deleteLoginId(location.toString());

	if (!$i || $i.id !== loginId) {
		const account = await getAccountFromId(loginId);
		if (account) {
			login(account.token, target);
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
	const i = (document.cookie.match(/igi=(\w+)/) || [null, null])[1];

	if (i != null && i !== 'null') {
		if (_DEV_) {
			console.log('signing...');
		}

		try {
			document.body.innerHTML = '<div>Please wait...</div>';
			await login(i);
		} catch (e) {
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

fetchInstance().then(() => {
	localStorage.setItem('v', instance.version);

	// Init service worker
	initializeSw();
});

stream.init($i);

const app = createApp(await (
	location.search === '?zen'        ? import('@/ui/zen.vue') :
	!$i                               ? import('@/ui/visitor.vue') :
	ui === 'deck'                     ? import('@/ui/deck.vue') :
	ui === 'desktop'                  ? import('@/ui/desktop.vue') :
	ui === 'chat'                     ? import('@/ui/chat/index.vue') :
	import('@/ui/default.vue')
).then(x => x.default));

if (_DEV_) {
	app.config.performance = true;
}

app.config.globalProperties = {
	$i,
	$store: defaultStore,
	$instance: instance,
	$t: i18n.t,
	$ts: i18n.locale,
};

app.use(router);
// eslint-disable-next-line vue/component-definition-name-casing
app.component('Fa', FontAwesomeIcon);

widgets(app);
directives(app);
components(app);

await router.isReady();

//document.body.innerHTML = '<div id="app"></div>';

app.mount('body');

watch(defaultStore.reactiveState.darkMode, (darkMode) => {
	import('@/scripts/theme').then(({ builtinThemes }) => {
		const themes = builtinThemes.concat(getThemes());
		applyTheme(themes.find(x => x.id === (darkMode ? ColdDeviceStorage.get('darkTheme') : ColdDeviceStorage.get('lightTheme'))));
	});
}, { immediate: localStorage.theme == null });

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

// shortcut
document.addEventListener('keydown', makeHotkey({
	'd': () => {
		defaultStore.set('darkMode', !defaultStore.state.darkMode);
	},
	'p|n': post,
	's': search,
	//TODO: 'h|/': help
}));

watch(defaultStore.reactiveState.useBlurEffectForModal, v => {
	document.documentElement.style.setProperty('--modalBgFilter', v ? 'blur(4px)' : 'none');
}, { immediate: true });

let reloadDialogShowing = false;
stream.on('_disconnected_', async () => {
	if (defaultStore.state.serverDisconnectedBehavior === 'reload') {
		location.reload();
	} else if (defaultStore.state.serverDisconnectedBehavior === 'dialog') {
		if (reloadDialogShowing) return;
		reloadDialogShowing = true;
		const { canceled } = await dialog({
			type: 'warning',
			title: i18n.locale.disconnectedFromServer,
			text: i18n.locale.reloadConfirm,
			showCancelButton: true
		});
		reloadDialogShowing = false;
		if (!canceled) {
			location.reload();
		}
	}
});

stream.on('emojiAdded', data => {
	// TODO
	//store.commit('instance/set', );
});

for (const plugin of ColdDeviceStorage.get('plugins').filter(p => p.active)) {
	import('./plugin').then(({ install }) => {
		install(plugin);
	});
}

if ($i) {
	if ('Notification' in window) {
		// 許可を得ていなかったらリクエスト
		if (Notification.permission === 'default') {
			Notification.requestPermission();
		}
	}

	const main = stream.useSharedConnection('main', 'System');

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

	main.on('readAllMessagingMessages', () => {
		updateAccount({ hasUnreadMessagingMessage: false });
	});

	main.on('unreadMessagingMessage', () => {
		updateAccount({ hasUnreadMessagingMessage: true });
		sound.play('chatBg');
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

	main.on('readAllChannels', () => {
		updateAccount({ hasUnreadChannel: false });
	});

	main.on('unreadChannel', () => {
		updateAccount({ hasUnreadChannel: true });
		sound.play('channel');
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
