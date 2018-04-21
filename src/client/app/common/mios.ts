import Vue from 'vue';
import { EventEmitter } from 'eventemitter3';
import * as merge from 'object-assign-deep';
import * as uuid from 'uuid';

import { hostname, apiUrl, swPublickey, version, lang, googleMapsApiKey } from '../config';
import Progress from './scripts/loading';
import Connection from './scripts/streaming/stream';
import { HomeStreamManager } from './scripts/streaming/home';
import { DriveStreamManager } from './scripts/streaming/drive';
import { ServerStreamManager } from './scripts/streaming/server';
import { MessagingIndexStreamManager } from './scripts/streaming/messaging-index';
import { OthelloStreamManager } from './scripts/streaming/othello';

import Err from '../common/views/components/connect-failed.vue';
import { LocalTimelineStreamManager } from './scripts/streaming/local-timeline';
import { GlobalTimelineStreamManager } from './scripts/streaming/global-timeline';

const defaultSettings = {
	fetchOnScroll: true,
	showMaps: true,
	showPostFormOnTopOfTl: false,
	gradientWindowHeader: false,
	showReplyTarget: true,
	showMyRenotes: true,
	showRenotedMyNotes: true
};

//#region api requests
let spinner = null;
let pending = 0;
//#endregion

export type API = {
	chooseDriveFile: (opts: {
		title?: string;
		currentFolder?: any;
		multiple?: boolean;
	}) => Promise<any>;

	chooseDriveFolder: (opts: {
		title?: string;
		currentFolder?: any;
	}) => Promise<any>;

	dialog: (opts: {
		title: string;
		text: string;
		actions?: Array<{
			text: string;
			id?: string;
		}>;
	}) => Promise<string>;

	input: (opts: {
		title: string;
		placeholder?: string;
		default?: string;
	}) => Promise<string>;

	post: (opts?: {
		reply?: any;
		renote?: any;
	}) => void;

	notify: (message: string) => void;
};

/**
 * Misskey Operating System
 */
export default class MiOS extends EventEmitter {
	/**
	 * Misskeyの /meta で取得できるメタ情報
	 */
	private meta: {
		data: { [x: string]: any };
		chachedAt: Date;
	};

	private isMetaFetching = false;

	public app: Vue;

	public new(vm, props) {
		const w = new vm({
			parent: this.app,
			propsData: props
		}).$mount();
		document.body.appendChild(w.$el);
	}

	/**
	 * A signing user
	 */
	public i: { [x: string]: any };

	/**
	 * Whether signed in
	 */
	public get isSignedIn() {
		return this.i != null;
	}

	/**
	 * Whether is debug mode
	 */
	public get debug() {
		return localStorage.getItem('debug') == 'true';
	}

	/**
	 * Whether enable sounds
	 */
	public get isEnableSounds() {
		return localStorage.getItem('enableSounds') == 'true';
	}

	public apis: API;

	/**
	 * A connection manager of home stream
	 */
	public stream: HomeStreamManager;

	/**
	 * Connection managers
	 */
	public streams: {
		localTimelineStream: LocalTimelineStreamManager;
		globalTimelineStream: GlobalTimelineStreamManager;
		driveStream: DriveStreamManager;
		serverStream: ServerStreamManager;
		messagingIndexStream: MessagingIndexStreamManager;
		othelloStream: OthelloStreamManager;
	} = {
		localTimelineStream: null,
		globalTimelineStream: null,
		driveStream: null,
		serverStream: null,
		messagingIndexStream: null,
		othelloStream: null
	};

	/**
	 * A registration of service worker
	 */
	private swRegistration: ServiceWorkerRegistration = null;

	/**
	 * Whether should register ServiceWorker
	 */
	private shouldRegisterSw: boolean;

	/**
	 * ウィンドウシステム
	 */
	public windows = new WindowSystem();

	/**
	 * MiOSインスタンスを作成します
	 * @param shouldRegisterSw ServiceWorkerを登録するかどうか
	 */
	constructor(shouldRegisterSw = false) {
		super();

		this.shouldRegisterSw = shouldRegisterSw;

		//#region BIND
		this.log = this.log.bind(this);
		this.logInfo = this.logInfo.bind(this);
		this.logWarn = this.logWarn.bind(this);
		this.logError = this.logError.bind(this);
		this.init = this.init.bind(this);
		this.api = this.api.bind(this);
		this.getMeta = this.getMeta.bind(this);
		this.registerSw = this.registerSw.bind(this);
		//#endregion

		if (this.debug) {
			(window as any).os = this;
		}
	}

	private googleMapsIniting = false;

	public getGoogleMaps() {
		return new Promise((res, rej) => {
			if ((window as any).google && (window as any).google.maps) {
				res((window as any).google.maps);
			} else {
				this.once('init-google-maps', () => {
					res((window as any).google.maps);
				});

				//#region load google maps api
				if (!this.googleMapsIniting) {
					this.googleMapsIniting = true;
					(window as any).initGoogleMaps = () => {
						this.emit('init-google-maps');
					};
					const head = document.getElementsByTagName('head')[0];
					const script = document.createElement('script');
					script.setAttribute('src', `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=initGoogleMaps`);
					script.setAttribute('async', 'true');
					script.setAttribute('defer', 'true');
					head.appendChild(script);
				}
				//#endregion
			}
		});
	}

	public log(...args) {
		if (!this.debug) return;
		console.log.apply(null, args);
	}

	public logInfo(...args) {
		if (!this.debug) return;
		console.info.apply(null, args);
	}

	public logWarn(...args) {
		if (!this.debug) return;
		console.warn.apply(null, args);
	}

	public logError(...args) {
		if (!this.debug) return;
		console.error.apply(null, args);
	}

	public signout() {
		localStorage.removeItem('me');
		document.cookie = `i=; domain=${hostname}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
		location.href = '/';
	}

	/**
	 * Initialize MiOS (boot)
	 * @param callback A function that call when initialized
	 */
	public async init(callback) {
		//#region Init stream managers
		this.streams.serverStream = new ServerStreamManager(this);

		this.once('signedin', () => {
			// Init home stream manager
			this.stream = new HomeStreamManager(this, this.i);

			// Init other stream manager
			this.streams.localTimelineStream = new LocalTimelineStreamManager(this, this.i);
			this.streams.globalTimelineStream = new GlobalTimelineStreamManager(this, this.i);
			this.streams.driveStream = new DriveStreamManager(this, this.i);
			this.streams.messagingIndexStream = new MessagingIndexStreamManager(this, this.i);
			this.streams.othelloStream = new OthelloStreamManager(this, this.i);
		});
		//#endregion

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
				if (res.status !== 200) {
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
				document.body.innerHTML = '<div id="err"></div>';
				new Vue({
					render: createEl => createEl(Err)
				}).$mount('#err');

				Progress.done();
			});

			function done() {
				if (cb) cb(me);
			}
		};

		// フェッチが完了したとき
		const fetched = me => {
			if (me) {
				// デフォルトの設定をマージ
				me.clientSettings = Object.assign(defaultSettings, me.clientSettings);

				// ローカルストレージにキャッシュ
				localStorage.setItem('me', JSON.stringify(me));
			}

			this.i = me;

			this.emit('signedin');

			// Finish init
			callback();

			//#region Note

			// Init service worker
			if (this.shouldRegisterSw) this.registerSw();

			//#endregion
		};

		// Get cached account data
		const cachedMe = JSON.parse(localStorage.getItem('me'));

		// キャッシュがあったとき
		if (cachedMe) {
			if (cachedMe.token == null) {
				this.signout();
				return;
			}

			// とりあえずキャッシュされたデータでお茶を濁して(?)おいて、
			fetched(cachedMe);

			// 後から新鮮なデータをフェッチ
			fetchme(cachedMe.token, freshData => {
				merge(cachedMe, freshData);
			});
		} else {
			// Get token from cookie
			const i = (document.cookie.match(/i=(!\w+)/) || [null, null])[1];

			fetchme(i, fetched);
		}
	}

	/**
	 * Register service worker
	 */
	private registerSw() {
		// Check whether service worker and push manager supported
		const isSwSupported =
			('serviceWorker' in navigator) && ('PushManager' in window);

		// Reject when browser not service worker supported
		if (!isSwSupported) return;

		// Reject when not signed in to Misskey
		if (!this.isSignedIn) return;

		// When service worker activated
		navigator.serviceWorker.ready.then(registration => {
			this.log('[sw] ready: ', registration);

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
				this.log('[sw] Subscribe OK:', subscription);

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
				this.logError('[sw] Subscribe Error:', err);

				// 通知が許可されていなかったとき
				if (err.name == 'NotAllowedError') {
					this.logError('[sw] Subscribe failed due to notification not allowed');
					return;
				}

				// 違うapplicationServerKey (または gcm_sender_id)のサブスクリプションが
				// 既に存在していることが原因でエラーになった可能性があるので、
				// そのサブスクリプションを解除しておく
				const subscription = await this.swRegistration.pushManager.getSubscription();
				if (subscription) subscription.unsubscribe();
			});
		});

		// Whether use raw version script
		const raw = (localStorage.getItem('useRawScript') == 'true' && this.debug)
			|| process.env.NODE_ENV != 'production';

		// The path of service worker script
		const sw = `/sw.${version}.${lang}.${raw ? 'raw' : 'min'}.js`;

		// Register service worker
		navigator.serviceWorker.register(sw).then(registration => {
			// 登録成功
			this.logInfo('[sw] Registration successful with scope: ', registration.scope);
		}).catch(err => {
			// 登録失敗 :(
			this.logError('[sw] Registration failed: ', err);
		});
	}

	public requests = [];

	/**
	 * Misskey APIにリクエストします
	 * @param endpoint エンドポイント名
	 * @param data パラメータ
	 */
	public api(endpoint: string, data: { [x: string]: any } = {}): Promise<{ [x: string]: any }> {
		if (++pending === 1) {
			spinner = document.createElement('div');
			spinner.setAttribute('id', 'wait');
			document.body.appendChild(spinner);
		}

		const onFinally = () => {
			if (--pending === 0) spinner.parentNode.removeChild(spinner);
		};

		const promise = new Promise((resolve, reject) => {
			const viaStream = this.stream.hasConnection &&
				(localStorage.getItem('apiViaStream') ? localStorage.getItem('apiViaStream') == 'true' : true);

			if (viaStream) {
				const stream = this.stream.borrow();
				const id = Math.random().toString();

				stream.once(`api-res:${id}`, res => {
					if (res == null || Object.keys(res).length == 0) {
						resolve(null);
					} else if (res.res) {
						resolve(res.res);
					} else {
						reject(res.e);
					}
				});

				stream.send({
					type: 'api',
					id,
					endpoint,
					data
				});
			} else {
				// Append a credential
				if (this.isSignedIn) (data as any).i = this.i.token;

				const req = {
					id: uuid(),
					date: new Date(),
					name: endpoint,
					data,
					res: null,
					status: null
				};

				if (this.debug) {
					this.requests.push(req);
				}

				// Send request
				fetch(endpoint.indexOf('://') > -1 ? endpoint : `${apiUrl}/${endpoint}`, {
					method: 'POST',
					body: JSON.stringify(data),
					credentials: endpoint === 'signin' ? 'include' : 'omit',
					cache: 'no-cache'
				}).then(async (res) => {
					const body = res.status === 204 ? null : await res.json();

					if (this.debug) {
						req.status = res.status;
						req.res = body;
					}

					if (res.status === 200) {
						resolve(body);
					} else if (res.status === 204) {
						resolve();
					} else {
						reject(body.error);
					}
				}).catch(reject);
			}
		});

		promise.then(onFinally, onFinally);

		return promise;
	}

	/**
	 * Misskeyのメタ情報を取得します
	 * @param force キャッシュを無視するか否か
	 */
	public getMeta(force = false) {
		return new Promise<{ [x: string]: any }>(async (res, rej) => {
			if (this.isMetaFetching) {
				this.once('_meta_fetched_', () => {
					res(this.meta.data);
				});
				return;
			}

			const expire = 1000 * 60; // 1min

			// forceが有効, meta情報を保持していない or 期限切れ
			if (force || this.meta == null || Date.now() - this.meta.chachedAt.getTime() > expire) {
				this.isMetaFetching = true;
				const meta = await this.api('meta');
				this.meta = {
					data: meta,
					chachedAt: new Date()
				};
				this.isMetaFetching = false;
				this.emit('_meta_fetched_');
				res(meta);
			} else {
				res(this.meta.data);
			}
		});
	}

	public connections: Connection[] = [];

	public registerStreamConnection(connection: Connection) {
		this.connections.push(connection);
	}

	public unregisterStreamConnection(connection: Connection) {
		this.connections = this.connections.filter(c => c != connection);
	}
}

class WindowSystem extends EventEmitter {
	public windows = new Set();

	public add(window) {
		this.windows.add(window);
		this.emit('added', window);
	}

	public remove(window) {
		this.windows.delete(window);
		this.emit('removed', window);
	}

	public getAll() {
		return this.windows;
	}
}

/**
 * Convert the URL safe base64 string to a Uint8Array
 * @param base64String base64 string
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - base64String.length % 4) % 4);
	const base64 = (base64String + padding)
		.replace(/\-/g, '+')
		.replace(/_/g, '/');

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}
