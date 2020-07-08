import autobind from 'autobind-decorator';
import { EventEmitter } from 'eventemitter3';

import { apiUrl, version } from './config';
import Progress from './scripts/loading';

import Stream from './scripts/stream';
import store from './store';

/**
 * Misskey Operating System
 */
export default class MiOS extends EventEmitter {
	public store: ReturnType<typeof store>;

	/**
	 * A connection manager of home stream
	 */
	public stream: Stream;

	/**
	 * A registration of service worker
	 */
	private swRegistration: ServiceWorkerRegistration = null;

	constructor(vuex: MiOS['store']) {
		super();
		this.store = vuex;
	}

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

		// ユーザーをフェッチしてコールバックする
		const fetchme = (token, cb) => {
			let me = null;

			// Return when not signed in
			if (token == null || token === 'null') {
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
			let i = localStorage.getItem('i');

			// 連携ログインの場合用にCookieを参照する
			if (i == null || i === 'null') {
				i = (document.cookie.match(/igi=(\w+)/) || [null, null])[1];
			}

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
				this.store.dispatch('api', {
					endpoint: 'sw/register',
					data: {
						endpoint: subscription.endpoint,
						auth: encode(subscription.getKey('auth')),
						publickey: encode(subscription.getKey('p256dh'))
					}
				});
			})
			// When subscribe failed
			.catch(async (err: Error) => {
				// 通知が許可されていなかったとき
				if (err.name === 'NotAllowedError') {
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
