/**
 * App initializer
 */

import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import VModal from 'vue-js-modal';
import * as TreeView from 'vue-json-tree-view';
import VAnimateCss from 'v-animate-css';
import Element from 'element-ui';
import ElementLocaleEn from 'element-ui/lib/locale/lang/en';
import ElementLocaleJa from 'element-ui/lib/locale/lang/ja';

import App from './app.vue';
import checkForUpdate from './common/scripts/check-for-update';
import MiOS, { API } from './mios';
import { version, codename, lang } from './config';

let elementLocale;
switch (lang) {
	case 'ja': elementLocale = ElementLocaleJa; break;
	case 'en': elementLocale = ElementLocaleEn; break;
	default: elementLocale = ElementLocaleEn; break;
}

Vue.use(Vuex);
Vue.use(VueRouter);
Vue.use(VModal);
Vue.use(TreeView);
Vue.use(VAnimateCss);
Vue.use(Element, { locale: elementLocale });

// Register global directives
require('./common/views/directives');

// Register global components
require('./common/views/components');
require('./common/views/widgets');

// Register global filters
require('./common/views/filters');

Vue.mixin({
	destroyed(this: any) {
		if (this.$el.parentNode) {
			this.$el.parentNode.removeChild(this.$el);
		}
	}
});

/**
 * APP ENTRY POINT!
 */

console.info(`Misskey v${version} (${codename})`);
console.info(
	'%cここにコードを入力したり張り付けたりしないでください。アカウントが不正利用される可能性があります。',
	'color: red; background: yellow; font-size: 16px; font-weight: bold;');

// BootTimer解除
window.clearTimeout((window as any).mkBootTimer);
delete (window as any).mkBootTimer;

//#region Set lang attr
const html = document.documentElement;
html.setAttribute('lang', lang);
//#endregion

// iOSでプライベートモードだとlocalStorageが使えないので既存のメソッドを上書きする
try {
	localStorage.setItem('kyoppie', 'yuppie');
} catch (e) {
	Storage.prototype.setItem = () => { }; // noop
}

// クライアントを更新すべきならする
if (localStorage.getItem('should-refresh') == 'true') {
	localStorage.removeItem('should-refresh');
	location.reload(true);
}

// MiOSを初期化してコールバックする
export default (callback: (launch: (router: VueRouter, api?: (os: MiOS) => API) => [Vue, MiOS]) => void, sw = false) => {
	const os = new MiOS(sw);

	os.init(() => {
		// アプリ基底要素マウント
		document.body.innerHTML = '<div id="app"></div>';

		const launch = (router: VueRouter, api?: (os: MiOS) => API) => {
			os.apis = api ? api(os) : null;

			//#region Dark/Light
			Vue.mixin({
				data() {
					return {
						_unwatchDarkmode_: null
					};
				},
				mounted() {
					const apply = v => {
						if (this.$el.setAttribute == null) return;
						if (v) {
							this.$el.setAttribute('data-darkmode', 'true');
						} else {
							this.$el.removeAttribute('data-darkmode');
						}
					};

					apply(os.store.state.device.darkmode);

					this._unwatchDarkmode_ = os.store.watch(s => {
						return s.device.darkmode;
					}, apply);
				},
				beforeDestroy() {
					this._unwatchDarkmode_();
				}
			});

			os.store.watch(s => {
				return s.device.darkmode;
			}, v => {
				if (v) {
					document.documentElement.setAttribute('data-darkmode', 'true');
				} else {
					document.documentElement.removeAttribute('data-darkmode');
				}
			});
			//#endregion

			Vue.mixin({
				data() {
					return {
						os,
						api: os.api,
						apis: os.apis
					};
				}
			});

			const app = new Vue({
				store: os.store,
				router,
				render: createEl => createEl(App)
			});

			os.app = app;

			// マウント
			app.$mount('#app');

			return [app, os] as [Vue, MiOS];
		};

		try {
			callback(launch);
		} catch (e) {
			panic(e);
		}

		//#region 更新チェック
		const preventUpdate = os.store.state.device.preventUpdate;
		if (!preventUpdate) {
			setTimeout(() => {
				checkForUpdate(os);
			}, 3000);
		}
		//#endregion
	});
};

// BSoD
function panic(e) {
	console.error(e);

	// Display blue screen
	document.documentElement.style.background = '#1269e2';
	document.body.innerHTML =
		'<div id="error">'
			+ '<h1>:( 致命的な問題が発生しました。</h1>'
			+ '<p>お使いのブラウザ(またはOS)のバージョンを更新すると解決する可能性があります。</p>'
			+ '<hr>'
			+ `<p>エラーコード: ${e.toString()}</p>`
			+ `<p>ブラウザ バージョン: ${navigator.userAgent}</p>`
			+ `<p>クライアント バージョン: ${version}</p>`
			+ '<hr>'
			+ '<p>問題が解決しない場合は、上記の情報をお書き添えの上 syuilotan@yahoo.co.jp までご連絡ください。</p>'
			+ '<p>Thank you for using Misskey.</p>'
		+ '</div>';

	// TODO: Report the bug
}
