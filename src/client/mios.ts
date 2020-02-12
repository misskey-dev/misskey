import autobind from 'autobind-decorator';
import Vue from 'vue';
import { EventEmitter } from 'eventemitter3';

import initStore from './store';
import { apiUrl, version, locale } from './config';
import Progress from './scripts/loading';

import Stream from './scripts/stream';

//#region api requests
let spinner = null;
let pending = 0;
//#endregion

/**
 * Misskey Operating System
 */
export default class MiOS extends EventEmitter {
	public app: Vue;

	public store: ReturnType<typeof initStore>;

	/**
	 * A connection manager of home stream
	 */
	public stream: Stream;

	/**
	 * A registration of service worker
	 */
	private swRegistration: ServiceWorkerRegistration = null;

	@autobind
	public signout() {
		this.store.dispatch('logout');
		location.href = '/';
	}

	/**
	 * Initialize MiOS (boot)
	 * @param callback A function that call when initialized
	 */
	@autobind
	public async init(callback) {
		const finish = () => {
			callback();

			this.store.dispatch('instance/fetch').then(() => {
				// Init service worker
				if (this.store.state.instance.meta.swPublickey) this.registerSw(this.store.state.instance.meta.swPublickey);
			});
		};

		this.store = initStore(this);

		// ユーザーをフェッチしてコールバックする
		const fetchme = (token, cb) => {
			let me = null;

			// Return when not signed in
			if (token == null) {
				return done();
			}

			// Fetch user
			fetch(`${apiUrl}/i`, {
				method: 'POST',
				body: JSON.stringify({
					i: token
				})
			})
			// When success
			.then(res => {
				// When failed to authenticate user
				if (res.status !== 200 && res.status < 500) {
					return this.signout();
				}

				// Parse response
				res.json().then(i => {
					me = i;
					me.token = token;
					done();
				});
			})
			// When failure
			.catch(() => {
				// Render the error screen
				document.body.innerHTML = '<div id="err">Oops!</div>';

				Progress.done();
			});

			function done() {
				if (cb) cb(me);
			}
		};

		// フェッチが完了したとき
		const fetched = () => {
			this.emit('signedin');

			this.initStream();

			// Finish init
			finish();
		};

		// キャッシュがあったとき
		if (this.store.state.i != null) {
			if (this.store.state.i.token == null) {
				this.signout();
				return;
			}

			// とりあえずキャッシュされたデータでお茶を濁して(?)おいて、
			fetched();

			// 後から新鮮なデータをフェッチ
			fetchme(this.store.state.i.token, freshData => {
				this.store.dispatch('mergeMe', freshData);
			});
		} else {
			// Get token from localStorage
			const i = localStorage.getItem('i');
			
			fetchme(i, me => {
				if (me) {
					this.store.dispatch('login', me);
					fetched();
				} else {
					this.initStream();

					// Finish init
					finish();
				}
			});
		}
	}

	@autobind
	private initStream() {
		this.stream = new Stream(this);

		if (this.store.getters.isSignedIn) {
			const main = this.stream.useSharedConnection('main');

			// 自分の情報が更新されたとき
			main.on('meUpdated', i => {
				this.store.dispatch('mergeMe', i);
			});

			main.on('readAllNotifications', () => {
				this.store.dispatch('mergeMe', {
					hasUnreadNotification: false
				});
			});

			main.on('unreadNotification', () => {
				this.store.dispatch('mergeMe', {
					hasUnreadNotification: true
				});
			});

			main.on('unreadMention', () => {
				this.store.dispatch('mergeMe', {
					hasUnreadMentions: true
				});
			});

			main.on('readAllUnreadMentions', () => {
				this.store.dispatch('mergeMe', {
					hasUnreadMentions: false
				});
			});

			main.on('unreadSpecifiedNote', () => {
				this.store.dispatch('mergeMe', {
					hasUnreadSpecifiedNotes: true
				});
			});

			main.on('readAllUnreadSpecifiedNotes', () => {
				this.store.dispatch('mergeMe', {
					hasUnreadSpecifiedNotes: false
				});
			});

			main.on('readAllMessagingMessages', () => {
				this.store.dispatch('mergeMe', {
					hasUnreadMessagingMessage: false
				});
			});

			main.on('unreadMessagingMessage', () => {
				this.store.dispatch('mergeMe', {
					hasUnreadMessagingMessage: true
				});
			});

			main.on('readAllAntennas', () => {
				this.store.dispatch('mergeMe', {
					hasUnreadAntenna: false
				});
			});

			main.on('unreadAntenna', () => {
				this.store.dispatch('mergeMe', {
					hasUnreadAntenna: true
				});
			});

			main.on('readAllAnnouncements', () => {
				this.store.dispatch('mergeMe', {
					hasUnreadAnnouncement: false
				});
			});

			main.on('clientSettingUpdated', x => {
				this.store.commit('settings/set', {
					key: x.key,
					value: x.value
				});
			});

			// トークンが再生成されたとき
			// このままではMisskeyが利用できないので強制的にサインアウトさせる
			main.on('myTokenRegenerated', () => {
				alert(locale['common']['my-token-regenerated']);
				this.signout();
			});
		}
	}

	/**
	 * Register service worker
	 */
	@autobind
	private registerSw(swPublickey: string) {
		// Check whether service worker and push manager supported
		const isSwSupported =
			('serviceWorker' in navigator) && ('PushManager' in window);

		// Reject when browser not service worker supported
		if (!isSwSupported) return;

		// Reject when not signed in to Misskey
		if (!this.store.getters.isSignedIn) return;

		// When service worker activated
		navigator.serviceWorker.ready.then(registration => {
			this.swRegistration = registration;

			// Options of pushManager.subscribe
			// SEE: https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe#Parameters
			const opts = {
				// A boolean indicating that the returned push subscription
				// will only be used for messages whose effect is made visible to the user.
				userVisibleOnly: true,

				// A public key your push server will use to send
				// messages to client apps via a push server.
				applicationServerKey: urlBase64ToUint8Array(swPublickey)
			};

			// Subscribe push notification
			this.swRegistration.pushManager.subscribe(opts).then(subscription => {
				function encode(buffer: ArrayBuffer) {
					return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
				}

				// Register
				this.api('sw/register', {
					endpoint: subscription.endpoint,
					auth: encode(subscription.getKey('auth')),
					publickey: encode(subscription.getKey('p256dh'))
				});
			})
			// When subscribe failed
			.catch(async (err: Error) => {
				// 通知が許可されていなかったとき
				if (err.name == 'NotAllowedError') {
					return;
				}

				// 違うapplicationServerKey (または gcm_sender_id)のサブスクリプションが
				// 既に存在していることが原因でエラーになった可能性があるので、
				// そのサブスクリプションを解除しておく
				const subscription = await this.swRegistration.pushManager.getSubscription();
				if (subscription) subscription.unsubscribe();
			});
		});

		// The path of service worker script
		const sw = `/sw.${version}.js`;

		// Register service worker
		navigator.serviceWorker.register(sw);
	}

	/**
	 * Misskey APIにリクエストします
	 * @param endpoint エンドポイント名
	 * @param data パラメータ
	 */
	@autobind
	public api(endpoint: string, data: { [x: string]: any } = {}, token?): Promise<{ [x: string]: any }> {
		if (++pending === 1) {
			spinner = document.createElement('div');
			spinner.setAttribute('id', 'wait');
			document.body.appendChild(spinner);
		}

		const onFinally = () => {
			if (--pending === 0) spinner.parentNode.removeChild(spinner);
		};

		const promise = new Promise((resolve, reject) => {
			// Append a credential
			if (this.store.getters.isSignedIn) (data as any).i = this.store.state.i.token;
			if (token) (data as any).i = token;

			// Send request
			fetch(endpoint.indexOf('://') > -1 ? endpoint : `${apiUrl}/${endpoint}`, {
				method: 'POST',
				body: JSON.stringify(data),
				credentials: 'omit',
				cache: 'no-cache'
			}).then(async (res) => {
				const body = res.status === 204 ? null : await res.json();

				if (res.status === 200) {
					resolve(body);
				} else if (res.status === 204) {
					resolve();
				} else {
					reject(body.error);
				}
			}).catch(reject);
		});

		promise.then(onFinally, onFinally);

		return promise;
	}
}

/**
 * Convert the URL safe base64 string to a Uint8Array
 * @param base64String base64 string
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - base64String.length % 4) % 4);
	const base64 = (base64String + padding)
		.replace(/-/g, '+')
		.replace(/_/g, '/');

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}
