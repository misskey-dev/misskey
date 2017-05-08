/**
 * boot
 */

import * as riot from 'riot';
import api from './common/scripts/api';
import signout from './common/scripts/signout';
import checkForUpdate from './common/scripts/check-for-update';
import mixin from './common/mixins';
import generateDefaultUserdata from './common/scripts/generate-default-userdata';
import CONFIG from './common/scripts/config';
require('./common/tags');

/**
 * MISSKEY ENTRY POINT!
 */

"use strict";

console.info(`Misskey v${VERSION}`);

document.domain = CONFIG.host;

// Set global configuration
riot.mixin({
	CONFIG
});

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

// ↓ iOSでプライベートモードだとlocalStorageが使えないので既存のメソッドを上書きする
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

	function fetched(me) {
		if (me) {
			riot.observable(me);

			me.update = data => {
				if (data) Object.assign(me, data);
				me.trigger('updated');
			};

			localStorage.setItem('me', JSON.stringify(me));

			me.on('updated', () => {
				// キャッシュ更新
				localStorage.setItem('me', JSON.stringify(me));
			});
		}

		mixin(me);

		const ini = document.getElementById('ini');
		ini.parentNode.removeChild(ini);

		const app = document.createElement('div');
		app.setAttribute('id', 'app');
		document.body.appendChild(app);

		try {
			callback(me);
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
	}).then(res => {
		// When failed to authenticate user
		if (res.status !== 200) {
			return signout();
		}

		res.json().then(i => {
			me = i;
			me.token = token;

			// initialize it if user data is empty
			me.data ? done() : init();
		});
	}, () => {
		riot.mount(document.body.appendChild(document.createElement('mk-error')));
	});

	function done() {
		if (cb) cb(me);
	}

	function init() {
		const data = generateDefaultUserdata();
		api(token, 'i/appdata/set', {
			data
		}).then(() => {
			me.data = data;
			done();
		});
	}
}

function panic(e) {
	console.error(e);
	document.body.innerHTML =
		`<div id="error">
			<h1>:( 致命的な問題が発生しました。</h1>
			<p>お使いのブラウザ(またはOS)のバージョンを更新すると解決する可能性があります。</p>
			<hr>
			<p>エラーコード: ${e.toString()}</p>
			<p>ブラウザ バージョン: ${navigator.userAgent}</p>
			<p>クライアント バージョン: ${VERSION}</p>
			<hr>
			<p>問題が解決しない場合は上記の情報をお書き添えの上 syuilotan@yahoo.co.jp までご連絡ください。</p>
			<p>Thank you for using Misskey.</p>
		</div>`;
	// TODO: Report the bug
}
