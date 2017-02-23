/**
 * boot
 */

const riot = require('riot');
require('velocity-animate');
const api = require('./common/scripts/api');
const signout = require('./common/scripts/signout');
const generateDefaultUserdata = require('./common/scripts/generate-default-userdata');
const mixins = require('./common/mixins');
const checkForUpdate = require('./common/scripts/check-for-update');
require('./common/tags');

/**
 * MISSKEY ENTORY POINT!
 */

"use strict";

const CONFIG = require('./common/scripts/config');

document.domain = CONFIG.host;

// Set global configration
riot.mixin({
	CONFIG
});

// ↓ iOS待ちPolyfill (SEE: http://caniuse.com/#feat=fetch)
require('whatwg-fetch');

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
if (DataTransferItemList && DataTransferItemList.prototype.forEach === undefined) {
	DataTransferItemList.prototype.forEach = Array.prototype.forEach;
}

// ↓ iOSでプライベートモードだとlocalStorageが使えないので既存のメソッドを上書きする
try {
	localStorage.setItem('kyoppie', 'yuppie');
} catch (e) {
	Storage.prototype.setItem = () => { }; // noop
}

// Check for Update
checkForUpdate();

// ユーザーをフェッチしてコールバックする
module.exports = callback => {
	// Get cached account data
	let cachedMe = JSON.parse(localStorage.getItem('me'));

	if (cachedMe && cachedMe.data && cachedMe.data.cache) {
		fetched(cachedMe);

		// 後から新鮮なデータをフェッチ
		fetchme(cachedMe.token, freshData => {
			Object.assign(cachedMe, freshData);
			cachedMe.trigger('updated');
		});
	} else {
		// キャッシュ無効なのにキャッシュが残ってたら掃除
		if (cachedMe) {
			localStorage.removeItem('me');
		}

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

			if (me.data.cache) {
				localStorage.setItem('me', JSON.stringify(me));

				me.on('updated', () => {
					// キャッシュ更新
					localStorage.setItem('me', JSON.stringify(me));
				});
			}
		}

		mixins(me);

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
	fetch(CONFIG.apiUrl + '/i', {
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
		riot.mount(document.body.appendChild(document.createElement('mk-core-error')), {
			retry: () => {
				fetchme(token, cb);
			}
		});
	});

	function done() {
		if (cb) cb(me);
	}

	function init() {
		const data = generateDefaultUserdata();
		api(token, 'i/appdata/set', {
			data: JSON.stringify(data)
		}).then(() => {
			me.data = data;
			done();
		});
	}
}

function panic(e) {
	console.error(e);
	document.body.innerHTML = '<div id="error"><p>致命的な問題が発生しました。</p></div>';
	// TODO: Report the bug
}
