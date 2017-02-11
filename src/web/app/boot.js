/**
 * boot
 */

const riot = require('riot');
require('velocity-animate');
const api = require('./common/scripts/api.ls');
const signout = require('./common/scripts/signout.ls');
const generateDefaultUserdata = require('./common/scripts/generate-default-userdata.ls');
const mixins = require('./common/mixins.ls');
const checkForUpdate = require('./common/scripts/check-for-update.ls');
require('./common/tags');

/**
 * MISSKEY ENTORY POINT!
 */

document.domain = CONFIG.host;

// ↓ iOS待ちPolyfill (SEE: http://caniuse.com/#feat=fetch)
require('whatwg-fetch');

// ↓ NodeList、HTMLCollectionで forEach を使えるようにする
if (NodeList.prototype.forEach === undefined) {
	NodeList.prototype.forEach = Array.prototype.forEach;
}
if (HTMLCollection.prototype.forEach === undefined) {
	HTMLCollection.prototype.forEach = Array.prototype.forEach;
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

	if (cachedMe != null && cachedMe.data != null && cachedMe.data.cache) {
		fetched(cachedMe);

		// 後から新鮮なデータをフェッチ
		fetchme(cachedMe.token, freshData => {
			Object.assign(cachedMe, freshData);
			cachedMe.trigger('updated');
		});
	} else {
		// キャッシュ無効なのにキャッシュが残ってたら掃除
		if (cachedMe != null) {
			localStorage.removeItem('me');
		}

		// Get token from cookie
		const i = (document.cookie.match(/i=(!\w+)/) || [null, null])[1];

		fetchme(i, fetched);
	}

	function fetched(me) {
		if (me != null) {
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

		const init = document.getElementById('init');
		init.parentNode.removeChild(init);

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
	fetch(CONFIG.api.url + "/i", {
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
			if (me.data != null) {
				done();
			} else {
				init();
			}
		});
	}, () => {
		const info = document.body.appendChild(document.createElement('mk-core-error'));
		riot.mount(info, {
			retry: () => {
				fetchme(token, cb);
			}
		});
	});

	function done() {
		if (cb != null) {
			cb(me);
		}
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
}
