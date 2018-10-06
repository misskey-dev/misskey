import { EventEmitter } from 'eventemitter3';
import * as ReconnectingWebsocket from 'reconnecting-websocket';
import { wsUrl } from '../../config';
import MiOS from '../../mios';

/**
 * Misskey stream connection
 */
export default class Stream extends EventEmitter {
	private stream: ReconnectingWebsocket;
	private state: string;
	private buffer: any[];
	private sharedConnections: Connection[] = [];

	constructor(os: MiOS) {
		super();

		this.state = 'initializing';
		this.buffer = [];

		const user = os.store.state.i;

		this.stream = new ReconnectingWebsocket(wsUrl + (user ? `?i=${user.token}` : ''));
		this.stream.addEventListener('open', this.onOpen);
		this.stream.addEventListener('close', this.onClose);
		this.stream.addEventListener('message', this.onMessage);

		// 自分の情報が更新されたとき
		this.on('meUpdated', i => {
			os.store.dispatch('mergeMe', i);
		});

		this.on('readAllNotifications', () => {
			os.store.dispatch('mergeMe', {
				hasUnreadNotification: false
			});
		});

		this.on('unreadNotification', () => {
			os.store.dispatch('mergeMe', {
				hasUnreadNotification: true
			});
		});

		this.on('readAllMessagingMessages', () => {
			os.store.dispatch('mergeMe', {
				hasUnreadMessagingMessage: false
			});
		});

		this.on('unreadMessagingMessage', () => {
			os.store.dispatch('mergeMe', {
				hasUnreadMessagingMessage: true
			});
		});

		this.on('unreadMention', () => {
			os.store.dispatch('mergeMe', {
				hasUnreadMentions: true
			});
		});

		this.on('readAllUnreadMentions', () => {
			os.store.dispatch('mergeMe', {
				hasUnreadMentions: false
			});
		});

		this.on('unreadSpecifiedNote', () => {
			os.store.dispatch('mergeMe', {
				hasUnreadSpecifiedNotes: true
			});
		});

		this.on('readAllUnreadSpecifiedNotes', () => {
			os.store.dispatch('mergeMe', {
				hasUnreadSpecifiedNotes: false
			});
		});

		this.on('clientSettingUpdated', x => {
			os.store.commit('settings/set', {
				key: x.key,
				value: x.value
			});
		});

		this.on('homeUpdated', x => {
			os.store.commit('settings/setHome', x);
		});

		this.on('mobileHomeUpdated', x => {
			os.store.commit('settings/setMobileHome', x);
		});

		this.on('widgetUpdated', x => {
			os.store.commit('settings/setWidget', {
				id: x.id,
				data: x.data
			});
		});

		// トークンが再生成されたとき
		// このままではMisskeyが利用できないので強制的にサインアウトさせる
		this.on('myTokenRegenerated', () => {
			alert('%i18n:common.my-token-regenerated%');
			os.signout();
		});
	}

	public useSharedConnection = (channel: string): Connection => {
		const existConnection = this.sharedConnections.find(c => c.channel === channel);

		if (existConnection) {
			existConnection.use();

			return existConnection;
		} else {
			const connection = new Connection(channel);

			this.sharedConnections.push(connection);

			return connection;
		}
	}

	public removeSharedConnection = (connection: Connection) => {
		this.sharedConnections = this.sharedConnections.filter(c => c.id !== connection.id);
	}

	/**
	 * Callback of when open connection
	 */
	private onOpen = () => {
		this.state = 'connected';
		this.emit('_connected_');

		// バッファーを処理
		const _buffer = [].concat(this.buffer); // Shallow copy
		this.buffer = []; // Clear buffer
		_buffer.forEach(data => {
			this.send(data); // Resend each buffered messages
		});
	}

	/**
	 * Callback of when close connection
	 */
	private onClose = () => {
		this.state = 'reconnecting';
		this.emit('_disconnected_');
	}

	/**
	 * Callback of when received a message from connection
	 */
	private onMessage = (message) => {
		const { type, body } = JSON.parse(message.data);

		if (type.startsWith('channel:')) {
			const id = type.split(':')[1];
			const connection = this.sharedConnections.find(c => c.id === id);
			connection.emit(type, body);
		} else {
			this.emit(type, body);
		}
	}

	/**
	 * Send a message to connection
	 */
	public send = (typeOrPayload, payload?) => {
		const data = arguments.length == 1 ? typeOrPayload : {
			type: typeOrPayload,
			body: payload
		};

		// まだ接続が確立されていなかったらバッファリングして次に接続した時に送信する
		if (this.state != 'connected') {
			this.buffer.push(data);
			return;
		}

		this.stream.send(JSON.stringify(data));
	}

	/**
	 * Close this connection
	 */
	public close = () => {
		this.stream.removeEventListener('open', this.onOpen);
		this.stream.removeEventListener('message', this.onMessage);
	}
}

class Connection extends EventEmitter {
	public channel: string;
	public id: string;
	public stream: Stream;
	private users = 0;
	private disposeTimerId: any;

	constructor(channel: string) {
		super();

		this.channel = channel;
		this.id = Math.random().toString();
	}

	public send = (typeOrPayload, payload?) => {
		const data = arguments.length == 1 ? typeOrPayload : {
			type: typeOrPayload,
			body: payload
		};

		this.stream.send('channel', {
			id: this.id,
			body: data
		});
	}

	public use = () => {
		this.users++;

		// タイマー解除
		if (this.disposeTimerId) {
			clearTimeout(this.disposeTimerId);
			this.disposeTimerId = null;
		}
	}

	public dispose = () => {
		this.users--;

		// そのコネクションの利用者が誰もいなくなったら
		if (this.users === 0) {
			// また直ぐに再利用される可能性があるので、一定時間待ち、
			// 新たな利用者が現れなければコネクションを切断する
			this.disposeTimerId = setTimeout(() => {
				this.disposeTimerId = null;
				this.removeAllListeners();
				this.send('disconnet', this.id);
				this.stream.removeSharedConnection(this);
			}, 3000);
		}
	}
}
