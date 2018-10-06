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
	private sharedConnections: SharedConnection[] = [];
	private nonSharedConnections: NonSharedConnection[] = [];

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

	public useSharedConnection = (channel: string): SharedConnection => {
		const existConnection = this.sharedConnections.find(c => c.channel === channel);

		if (existConnection) {
			existConnection.use();
			return existConnection;
		} else {
			const connection = new SharedConnection(channel);
			this.sharedConnections.push(connection);
			return connection;
		}
	}

	public removeSharedConnection = (connection: SharedConnection) => {
		this.sharedConnections = this.sharedConnections.filter(c => c.id !== connection.id);
	}

	public connectToChannel = (channel: string): NonSharedConnection => {
		const connection = new NonSharedConnection(channel);
		this.nonSharedConnections.push(connection);
		return connection;
	}

	public disconnectToChannel = (connection: NonSharedConnection) => {
		this.nonSharedConnections = this.nonSharedConnections.filter(c => c.id !== connection.id);
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

		if (type == 'channel') {
			const id = body.id;
			const connection = this.sharedConnections.find(c => c.id === id) || this.nonSharedConnections.find(c => c.id === id);
			connection.emit(body.data.type, body.data.data);
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

class SharedConnection extends EventEmitter {
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

class NonSharedConnection extends EventEmitter {
	public channel: string;
	public id: string;
	public stream: Stream;

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

	public dispose = () => {
		this.removeAllListeners();
		this.send('disconnet', this.id);
		this.stream.disconnectToChannel(this);
	}
}
