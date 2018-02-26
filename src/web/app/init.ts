/**
 * App initializer
 */

import Vue from 'vue';
import VueRouter from 'vue-router';
import VModal from 'vue-js-modal';

Vue.use(VueRouter);
Vue.use(VModal);

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

import App from './app.vue';

import checkForUpdate from './common/scripts/check-for-update';
import MiOS, { API } from './common/mios';
import { version, host, lang } from './config';

/**
 * APP ENTRY POINT!
 */

console.info(`Misskey v${version} (葵 aoi)`);
console.info(
	'%cここにコードを入力したり張り付けたりしないでください。アカウントが不正利用される可能性があります。',
	'color: red; background: yellow; font-size: 16px;');

// BootTimer解除
window.clearTimeout((window as any).mkBootTimer);
delete (window as any).mkBootTimer;

if (host != 'localhost') {
	document.domain = host;
}

//#region Set lang attr
const html = document.documentElement;
html.setAttribute('lang', lang);
//#endregion

//#region Set description meta tag
const head = document.getElementsByTagName('head')[0];
const meta = document.createElement('meta');
meta.setAttribute('name', 'description');
meta.setAttribute('content', '%i18n:common.misskey%');
head.appendChild(meta);
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
				created() {
					this.$watch('os.i', i => {
						// キャッシュ更新
						localStorage.setItem('me', JSON.stringify(i));
					}, {
						deep: true
					});
				},
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
		const preventUpdate = localStorage.getItem('preventUpdate') == 'true';
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
