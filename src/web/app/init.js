/**
 * App initializer
 */

'use strict';

import * as riot from 'riot';
import api from './common/scripts/api';
import signout from './common/scripts/signout';
import checkForUpdate from './common/scripts/check-for-update';
import Connection from './common/scripts/home-stream';
import ServerStreamManager from './common/scripts/server-stream-manager.ts';
import Progress from './common/scripts/loading';
import mixin from './common/mixins';
import CONFIG from './common/scripts/config';
require('./common/tags');

/**
 * APP ENTRY POINT!
 */

console.info(`Misskey v${VERSION} (葵 aoi)`);

{ // Set lang attr
	const html = document.documentElement;
	html.setAttribute('lang', LANG);
}

{ // Set description meta tag
	const head = document.getElementsByTagName('head')[0];
	const meta = document.createElement('meta');
	meta.setAttribute('name', 'description');
	meta.setAttribute('content', '%i18n:common.misskey%');
	head.appendChild(meta);
}

document.domain = CONFIG.host;

// Set global configuration
riot.mixin({ CONFIG });

// ↓ NodeList、HTMLCollection、FileList、DataTransferItemListで forEach を使えるようにする
if (NodeList.prototype.forEach === undefined) {
	NodeList.prototype.forEach = Array.prototype.forEach;
}
if (HTMLCollection.prototype.forEach === undefined) {
	HTMLCollection.prototype.forEach = Array.prototype.forEach;
}
if (FileList.prototype.forEach === undefined) {
	FileList.prototype.forEach = Array.prototype.forEach;
}
if (window.DataTransferItemList && DataTransferItemList.prototype.forEach === undefined) {
	DataTransferItemList.prototype.forEach = Array.prototype.forEach;
}

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

// 更新チェック
setTimeout(checkForUpdate, 3000);

// ユーザーをフェッチしてコールバックする
export default callback => {
	// Get cached account data
	let cachedMe = JSON.parse(localStorage.getItem('me'));

	if (cachedMe) {
		fetched(cachedMe);

		// 後から新鮮なデータをフェッチ
		fetchme(cachedMe.token, freshData => {
			Object.assign(cachedMe, freshData);
			cachedMe.trigger('updated');
		});
	} else {
		// Get token from cookie
		const i = (document.cookie.match(/i=(!\w+)/) || [null, null])[1];

		fetchme(i, fetched);
	}

	// フェッチが完了したとき
	function fetched(me) {
		if (me) {
			riot.observable(me);

			// この me オブジェクトを更新するメソッド
			me.update = data => {
				if (data) Object.assign(me, data);
				me.trigger('updated');
			};

			// ローカルストレージにキャッシュ
			localStorage.setItem('me', JSON.stringify(me));

			me.on('updated', () => {
				// キャッシュ更新
				localStorage.setItem('me', JSON.stringify(me));
			});
		}

		// Init home stream connection
		const stream = me ? new Connection(me) : null;

		// Init server stream connection manager
		const serverStreamManager = new ServerStreamManager();

		// ミックスイン初期化
		mixin(me, stream, serverStreamManager);

		// ローディング画面クリア
		const ini = document.getElementById('ini');
		ini.parentNode.removeChild(ini);

		// アプリ基底要素マウント
		const app = document.createElement('div');
		app.setAttribute('id', 'app');
		document.body.appendChild(app);

		try {
			callback(me, stream);
		} catch (e) {
			panic(e);
		}
	}
};

// ユーザーをフェッチしてコールバックする
function fetchme(token, cb) {
	let me = null;

	// Return when not signed in
	if (token == null) {
		return done();
	}

	// Fetch user
	fetch(`${CONFIG.apiUrl}/i`, {
		method: 'POST',
		body: JSON.stringify({
			i: token
		})
	}).then(res => { // When success
		// When failed to authenticate user
		if (res.status !== 200) {
			return signout();
		}

		res.json().then(i => {
			me = i;
			me.token = token;
			done();
		});
	}, () => { // When failure
		// Render the error screen
		document.body.innerHTML = '<mk-error />';
		riot.mount('*');
		Progress.done();
	});

	function done() {
		if (cb) cb(me);
	}
}

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
			+ `<p>クライアント バージョン: ${VERSION}</p>`
			+ '<hr>'
			+ '<p>問題が解決しない場合は、上記の情報をお書き添えの上 syuilotan@yahoo.co.jp までご連絡ください。</p>'
			+ '<p>Thank you for using Misskey.</p>'
		+ '</div>';

	// TODO: Report the bug
}
