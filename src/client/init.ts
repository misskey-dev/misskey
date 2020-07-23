/**
 * Client entry point
 */

import { createApp } from 'vue';
import VueMeta from 'vue-meta';
import VAnimateCss from 'v-animate-css';
import { createI18n } from 'vue-i18n';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { AiScript } from '@syuilo/aiscript';
import { deserialize } from '@syuilo/aiscript/built/serializer';

import VueHotkey from './scripts/hotkey';
import Root from './root.vue';
import MiOS from './mios';
import { version, langs, getLocale } from './config';
import { store } from './store';
import { router } from './router';
import { applyTheme, lightTheme } from './scripts/theme';
import { isDeviceDarkmode } from './scripts/is-device-darkmode';
import { clientDb, get, count } from './db';
import { setI18nContexts } from './scripts/set-i18n-contexts';
import { createPluginEnv } from './scripts/aiscript/api';

//#region Fetch locale data
const i18n = createI18n({
	legacy: true,
});

await count(clientDb.i18n).then(async n => {
	if (n === 0) return setI18nContexts(lang, version, i18n);
	if ((await get('_version_', clientDb.i18n) !== version)) return setI18nContexts(lang, version, i18n, true);

	i18n.locale = lang;
	i18n.setLocaleMessage(lang, await getLocale());
});
//#endregion

const app = createApp(Root);

app.use(store);
app.use(router);
app.use(VueHotkey);
app.use(VueMeta);
app.use(VAnimateCss);
app.use(i18n);
app.component('fa', FontAwesomeIcon);

require('./directives');
require('./components');
require('./widgets');

app.mixin({
	methods: {
		destroyDom() {
			this.$destroy();

			if (this.$el.parentNode) {
				this.$el.parentNode.removeChild(this.$el);
			}
		}
	}
});

console.info(`Misskey v${version}`);

if (localStorage.getItem('theme') == null) {
	applyTheme(lightTheme);
}

//#region SEE: https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
// TODO: いつの日にか消したい
const vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);
window.addEventListener('resize', () => {
	const vh = window.innerHeight * 0.01;
	document.documentElement.style.setProperty('--vh', `${vh}px`);
});
//#endregion

//#region Detect the user language
let lang = localStorage.getItem('lang');

if (lang == null) {
	if (langs.map(x => x[0]).includes(navigator.language)) {
		lang = navigator.language;
	} else {
		lang = langs.map(x => x[0]).find(x => x.split('-')[0] == navigator.language);

		if (lang == null) {
			// Fallback
			lang = 'en-US';
		}
	}

	localStorage.setItem('lang', lang);
}
//#endregion

// Detect the user agent
const ua = navigator.userAgent.toLowerCase();
const isMobile = /mobile|iphone|ipad|android/.test(ua);

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

// アプリ基底要素マウント
document.body.innerHTML = '<div id="app"></div>';

// 他のタブと永続化されたstateを同期
window.addEventListener('storage', e => {
	if (e.key === 'vuex') {
		store.replaceState({
			...store.state,
			...JSON.parse(e.newValue)
		});
	} else if (e.key === 'i') {
		location.reload();
	}
}, false);

const os = new MiOS(store);

os.init(async () => {
	app.mount('#app');

	store.watch(state => state.device.darkMode, darkMode => {
		import('./scripts/theme').then(({ builtinThemes }) => {
			const themes = builtinThemes.concat(store.state.device.themes);
			applyTheme(themes.find(x => x.id === (darkMode ? store.state.device.darkTheme : store.state.device.lightTheme)));
		});
	});

	//#region Sync dark mode
	if (store.state.device.syncDeviceDarkMode) {
		store.commit('device/set', { key: 'darkMode', value: isDeviceDarkmode() });
	}

	window.matchMedia('(prefers-color-scheme: dark)').addListener(mql => {
		if (store.state.device.syncDeviceDarkMode) {
			store.commit('device/set', { key: 'darkMode', value: mql.matches });
		}
	});
	//#endregion

	store.watch(state => state.device.useBlurEffectForModal, v => {
		document.documentElement.style.setProperty('--modalBgFilter', v ? 'blur(4px)' : 'none');
	}, { immediate: true });

	os.stream.on('emojiAdded', data => {
		// TODO
		//store.commit('instance/set', );
	});

	for (const plugin of store.state.deviceUser.plugins) {
		console.info('Plugin installed:', plugin.name, 'v' + plugin.version);

		const aiscript = new AiScript(createPluginEnv(app, {
			plugin: plugin,
			storageKey: 'plugins:' + plugin.id
		}), {
			in: (q) => {
				return new Promise(ok => {
					app.dialog({
						title: q,
						input: {}
					}).then(({ canceled, result: a }) => {
						ok(a);
					});
				});
			},
			out: (value) => {
				console.log(value);
			},
			log: (type, params) => {
			},
		});

		store.commit('initPlugin', { plugin, aiscript });

		aiscript.exec(deserialize(plugin.ast));
	}

	if (store.getters.isSignedIn) {
		if ('Notification' in window) {
			// 許可を得ていなかったらリクエスト
			if (Notification.permission === 'default') {
				Notification.requestPermission();
			}
		}

		const main = os.stream.useSharedConnection('main');

		// 自分の情報が更新されたとき
		main.on('meUpdated', i => {
			store.dispatch('mergeMe', i);
		});

		main.on('readAllNotifications', () => {
			store.dispatch('mergeMe', {
				hasUnreadNotification: false
			});
		});

		main.on('unreadNotification', () => {
			store.dispatch('mergeMe', {
				hasUnreadNotification: true
			});
		});

		main.on('unreadMention', () => {
			store.dispatch('mergeMe', {
				hasUnreadMentions: true
			});
		});

		main.on('readAllUnreadMentions', () => {
			store.dispatch('mergeMe', {
				hasUnreadMentions: false
			});
		});

		main.on('unreadSpecifiedNote', () => {
			store.dispatch('mergeMe', {
				hasUnreadSpecifiedNotes: true
			});
		});

		main.on('readAllUnreadSpecifiedNotes', () => {
			store.dispatch('mergeMe', {
				hasUnreadSpecifiedNotes: false
			});
		});

		main.on('readAllMessagingMessages', () => {
			store.dispatch('mergeMe', {
				hasUnreadMessagingMessage: false
			});
		});

		main.on('unreadMessagingMessage', () => {
			store.dispatch('mergeMe', {
				hasUnreadMessagingMessage: true
			});

			app.sound('chatBg');
		});

		main.on('readAllAntennas', () => {
			store.dispatch('mergeMe', {
				hasUnreadAntenna: false
			});
		});

		main.on('unreadAntenna', () => {
			store.dispatch('mergeMe', {
				hasUnreadAntenna: true
			});

			app.sound('antenna');
		});

		main.on('readAllAnnouncements', () => {
			store.dispatch('mergeMe', {
				hasUnreadAnnouncement: false
			});
		});

		main.on('clientSettingUpdated', x => {
			store.commit('settings/set', {
				key: x.key,
				value: x.value
			});
		});

		// トークンが再生成されたとき
		// このままではMisskeyが利用できないので強制的にサインアウトさせる
		main.on('myTokenRegenerated', () => {
			os.signout();
		});
	}
});
