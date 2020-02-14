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
import { applyTheme, lightTheme } from './theme';

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
let isMobile = /mobile|iphone|ipad|android/.test(ua);

// Get the <head> element
const head = document.getElementsByTagName('head')[0];

// If mobile, insert the viewport meta tag
if (isMobile || window.innerWidth <= 1024) {
	const viewport = document.getElementsByName("viewport").item(0);
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
	if (os.store.state.settings.wallpaper) document.documentElement.style.backgroundImage = `url(${os.store.state.settings.wallpaper})`;

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
		},
		router: router,
		render: createEl => createEl(App)
	});

	os.app = app;

	// マウント
	app.$mount('#app');
});
