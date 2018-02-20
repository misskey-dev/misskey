/**
 * App initializer
 */

declare const _VERSION_: string;
declare const _LANG_: string;
declare const _HOST_: string;
//declare const __CONSTS__: any;

import Vue from 'vue';
import VueRouter from 'vue-router';
import VModal from 'vue-js-modal';

Vue.use(VueRouter);
Vue.use(VModal);

// Register global directives
require('./common/views/directives');

// Register global components
require('./common/views/components');

// Register global filters
require('./common/filters');

Vue.mixin({
	destroyed(this: any) {
		if (this.$el.parentNode) {
			this.$el.parentNode.removeChild(this.$el);
		}
	}
});

import App from './app.vue';

import checkForUpdate from './common/scripts/check-for-update';
import MiOS, { API } from './common/mios';

/**
 * APP ENTRY POINT!
 */

console.info(`Misskey v${_VERSION_} (葵 aoi)`);

// BootTimer解除
window.clearTimeout((window as any).mkBootTimer);
delete (window as any).mkBootTimer;

if (_HOST_ != 'localhost') {
	document.domain = _HOST_;
}

//#region Set lang attr
const html = document.documentElement;
html.setAttribute('lang', _LANG_);
//#endregion

//#region Set description meta tag
const head = document.getElementsByTagName('head')[0];
const meta = document.createElement('meta');
meta.setAttribute('name', 'description');
meta.setAttribute('content', '%i18n:common.misskey%');
head.appendChild(meta);
//#endregion

// Set global configuration
//(riot as any).mixin(__CONSTS__);

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
export default (callback: (launch: (api: (os: MiOS) => API) => [Vue, MiOS]) => void, sw = false) => {
	const os = new MiOS(sw);

	os.init(() => {
		// アプリ基底要素マウント
		document.body.innerHTML = '<div id="app"></div>';

		const launch = (api: (os: MiOS) => API) => {
			os.apis = api(os);
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
				router: new VueRouter({
					mode: 'history'
				}),
				render: createEl => createEl(App)
			}).$mount('#app');

			return [app, os] as [Vue, MiOS];
		};

		try {
			callback(launch);
		} catch (e) {
			panic(e);
		}

		// 更新チェック
		setTimeout(() => {
			checkForUpdate(os);
		}, 3000);
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
			+ `<p>クライアント バージョン: ${_VERSION_}</p>`
			+ '<hr>'
			+ '<p>問題が解決しない場合は、上記の情報をお書き添えの上 syuilotan@yahoo.co.jp までご連絡ください。</p>'
			+ '<p>Thank you for using Misskey.</p>'
		+ '</div>';

	// TODO: Report the bug
}
