/**
 * App entry point
 */

import Vue from 'vue';
import Vuex from 'vuex';
import VueMeta from 'vue-meta';
import PortalVue from 'portal-vue';
import VAnimateCss from 'v-animate-css';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import i18n from './i18n';
import VueHotkey from './scripts/hotkey';
import App from './app.vue';
import MiOS from './mios';
import { version, langs, instanceName } from './config';
import PostFormDialog from './components/post-form-dialog.vue';
import Dialog from './components/dialog.vue';
import Menu from './components/menu.vue';
import { router } from './router';
import { applyTheme, lightTheme, builtinThemes } from './theme';
import { isDeviceDarkmode } from './scripts/is-device-darkmode';

Vue.use(Vuex);
Vue.use(VueHotkey);
Vue.use(VueMeta);
Vue.use(PortalVue);
Vue.use(VAnimateCss);
Vue.component('fa', FontAwesomeIcon);

require('./directives');
require('./components');
require('./widgets');
require('./filters');

Vue.mixin({
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

// v11互換性のため
if (localStorage.getItem('kyoppie') === 'yuppie') {
	const i = localStorage.getItem('i');
	localStorage.clear();
	localStorage.setItem('i', i);
	location.reload(true);
}

window.history.scrollRestoration = 'manual';

if (localStorage.getItem('theme') == null) {
	applyTheme(lightTheme);
}

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

//#region Fetch locale data
const cachedLocale = localStorage.getItem('locale');

if (cachedLocale == null) {
	fetch(`/assets/locales/${lang}.${version}.json`)
		.then(response => response.json()).then(locale => {
			localStorage.setItem('locale', JSON.stringify(locale));
			i18n.locale = lang;
			i18n.setLocaleMessage(lang, locale);
		});
} else {
	// TODO: 古い時だけ更新
	setTimeout(() => {
		fetch(`/assets/locales/${lang}.${version}.json`)
			.then(response => response.json()).then(locale => {
				localStorage.setItem('locale', JSON.stringify(locale));
			});
	}, 1000 * 5);
}
//#endregion

//#region Set lang attr
const html = document.documentElement;
html.setAttribute('lang', lang);
//#endregion

// iOSでプライベートモードだとlocalStorageが使えないので既存のメソッドを上書きする
try {
	localStorage.setItem('foo', 'bar');
} catch (e) {
	Storage.prototype.setItem = () => { }; // noop
}

// http://qiita.com/junya/items/3ff380878f26ca447f85
document.body.setAttribute('ontouchstart', '');

// アプリ基底要素マウント
document.body.innerHTML = '<div id="app"></div>';

const os = new MiOS();

os.init(async () => {
	window.addEventListener('storage', e => {
		if (e.key === 'vuex') {
			os.store.replaceState(JSON.parse(localStorage['vuex']));
		} else if (e.key === 'i') {
			location.reload();
		}
	}, false)

	//#region Sync dark mode
	if (os.store.state.device.syncDeviceDarkMode) {
		os.store.commit('device/set', { key: 'darkMode', value: isDeviceDarkmode() });
	}

	window.matchMedia('(prefers-color-scheme: dark)').addListener(mql => {
		if (os.store.state.device.syncDeviceDarkMode) {
			os.store.commit('device/set', { key: 'darkMode', value: mql.matches });
		}
	});
	//#endregion

	if ('Notification' in window && os.store.getters.isSignedIn) {
		// 許可を得ていなかったらリクエスト
		if (Notification.permission === 'default') {
			Notification.requestPermission();
		}
	}

	const app = new Vue({
		store: os.store,
		metaInfo: {
			title: null,
			titleTemplate: title => title ? `${title} | ${(instanceName || 'Misskey')}` : (instanceName || 'Misskey')
		},
		data() {
			return {
				stream: os.stream,
				isMobile: isMobile
			};
		},
		watch: {
			'$store.state.device.darkMode'() {
				// TODO: このファイルでbuiltinThemesを参照するとcode splittingが効かず、初回読み込み時に全てのテーマコードを読み込むことになってしまい無駄なので何とかする
				const themes = builtinThemes.concat(this.$store.state.device.themes);
				applyTheme(themes.find(x => x.id === (this.$store.state.device.darkMode ? this.$store.state.device.darkTheme : this.$store.state.device.lightTheme)));
			}
		},
		methods: {
			api: os.api,
			signout: os.signout,
			new(vm, props) {
				const x = new vm({
					parent: this,
					propsData: props
				}).$mount();
				document.body.appendChild(x.$el);
				return x;
			},
			dialog(opts) {
				const vm = this.new(Dialog, opts);
				const p: any = new Promise((res) => {
					vm.$once('ok', result => res({ canceled: false, result }));
					vm.$once('cancel', () => res({ canceled: true }));
				});
				p.close = () => {
					vm.close();
				};
				return p;
			},
			menu(opts) {
				const vm = this.new(Menu, opts);
				const p: any = new Promise((res) => {
					vm.$once('closed', () => res());
				});
				return p;
			},
			post(opts, cb) {
				const vm = this.new(PostFormDialog, opts);
				if (cb) vm.$once('closed', cb);
				(vm as any).focus();
			},
			sound(type: string) {
				if (this.$store.state.device.sfxVolume === 0) return;
				const sound = this.$store.state.device['sfx' + type.substr(0, 1).toUpperCase() + type.substr(1)];
				if (sound == null) return;
				const audio = new Audio(`/assets/sounds/${sound}.mp3`);
				audio.volume = this.$store.state.device.sfxVolume;
				audio.play();
			}
		},
		router: router,
		render: createEl => createEl(App)
	});

	os.app = app;

	// マウント
	app.$mount('#app');

	if (app.$store.getters.isSignedIn) {
		const main = os.stream.useSharedConnection('main');

		// 自分の情報が更新されたとき
		main.on('meUpdated', i => {
			app.$store.dispatch('mergeMe', i);
		});

		main.on('readAllNotifications', () => {
			app.$store.dispatch('mergeMe', {
				hasUnreadNotification: false
			});
		});

		main.on('unreadNotification', () => {
			app.$store.dispatch('mergeMe', {
				hasUnreadNotification: true
			});
		});

		main.on('unreadMention', () => {
			app.$store.dispatch('mergeMe', {
				hasUnreadMentions: true
			});
		});

		main.on('readAllUnreadMentions', () => {
			app.$store.dispatch('mergeMe', {
				hasUnreadMentions: false
			});
		});

		main.on('unreadSpecifiedNote', () => {
			app.$store.dispatch('mergeMe', {
				hasUnreadSpecifiedNotes: true
			});
		});

		main.on('readAllUnreadSpecifiedNotes', () => {
			app.$store.dispatch('mergeMe', {
				hasUnreadSpecifiedNotes: false
			});
		});

		main.on('readAllMessagingMessages', () => {
			app.$store.dispatch('mergeMe', {
				hasUnreadMessagingMessage: false
			});
		});

		main.on('unreadMessagingMessage', () => {
			app.$store.dispatch('mergeMe', {
				hasUnreadMessagingMessage: true
			});

			app.sound('chatBg');
		});

		main.on('readAllAntennas', () => {
			app.$store.dispatch('mergeMe', {
				hasUnreadAntenna: false
			});
		});

		main.on('unreadAntenna', () => {
			app.$store.dispatch('mergeMe', {
				hasUnreadAntenna: true
			});

			app.sound('antenna');
		});

		main.on('readAllAnnouncements', () => {
			app.$store.dispatch('mergeMe', {
				hasUnreadAnnouncement: false
			});
		});

		main.on('clientSettingUpdated', x => {
			app.$store.commit('settings/set', {
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
