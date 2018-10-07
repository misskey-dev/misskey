import autobind from 'autobind-decorator';
import * as websocket from 'websocket';
import Xev from 'xev';
import * as debug from 'debug';

import User, { IUser } from '../../../models/user';
import readNotification from '../common/read-notification';
import call from '../call';
import { IApp } from '../../../models/app';
import readNote from '../../../services/note/read';

import Channel from './channel';
import channels from './channels';

const log = debug('misskey');

/**
 * Main stream connection
 */
export default class Connection {
	public user?: IUser;
	public app: IApp;
	private wsConnection: websocket.connection;
	public subscriber: Xev;
	private channels: Channel[] = [];
	private subscribingNotes: any = {};

	constructor(
		wsConnection: websocket.connection,
		subscriber: Xev,
		user: IUser,
		app: IApp
	) {
		this.wsConnection = wsConnection;
		this.user = user;
		this.app = app;
		this.subscriber = subscriber;

		this.wsConnection.on('message', this.onWsConnectionMessage);
	}

	/**
	 * クライアントからメッセージ受信時
	 */
	@autobind
	private async onWsConnectionMessage(data: websocket.IMessage) {
		const { type, body } = JSON.parse(data.utf8Data);

		switch (type) {
			case 'api': this.onApiRequest(body); break;
			case 'alive': this.onAlive(); break;
			case 'readNotification': this.onReadNotification(body); break;
			case 'subNote': this.onSubscribeNote(body); break;
			case 'sn': this.onSubscribeNote(body); break; // alias
			case 'unsubNote': this.onUnsubscribeNote(body); break;
			case 'un': this.onUnsubscribeNote(body); break; // alias
			case 'connect': this.onChannelConnectRequested(body); break;
			case 'disconnect': this.onChannelDisconnectRequested(body); break;
			case 'channel': this.onChannelMessageRequested(body); break;
		}
	}

	/**
	 * APIリクエスト要求時
	 */
	@autobind
	private async onApiRequest(payload: any) {
		// 新鮮なデータを利用するためにユーザーをフェッチ
		const user = this.user ? await User.findOne({ _id: this.user._id }) : null;

		const endpoint = payload.endpoint || payload.ep; // alias

		// 呼び出し
		call(endpoint, user, this.app, payload.data).then(res => {
			this.sendMessageToWs(`api:${payload.id}`, { res });
		}).catch(e => {
			this.sendMessageToWs(`api:${payload.id}`, { e });
		});
	}

	@autobind
	private onAlive() {
		// Update lastUsedAt
		User.update({ _id: this.user._id }, {
			$set: {
				'lastUsedAt': new Date()
			}
		});
	}

	@autobind
	private onReadNotification(payload: any) {
		if (!payload.id) return;
		readNotification(this.user._id, payload.id);
	}

	/**
	 * 投稿購読要求時
	 */
	@autobind
	private onSubscribeNote(payload: any) {
		if (!payload.id) return;

		if (this.subscribingNotes[payload.id] == null) {
			this.subscribingNotes[payload.id] = 0;
		}

		this.subscribingNotes[payload.id]++;

		if (this.subscribingNotes[payload.id] == 1) {
			this.subscriber.on(`noteStream:${payload.id}`, this.onNoteStreamMessage);
		}

		if (payload.read) {
			readNote(this.user._id, payload.id);
		}
	}

	/**
	 * 投稿購読解除要求時
	 */
	@autobind
	private onUnsubscribeNote(payload: any) {
		if (!payload.id) return;

		this.subscribingNotes[payload.id]--;
		if (this.subscribingNotes[payload.id] <= 0) {
			delete this.subscribingNotes[payload.id];
			this.subscriber.off(`noteStream:${payload.id}`, this.onNoteStreamMessage);
		}
	}

	@autobind
	private async onNoteStreamMessage(data: any) {
		this.sendMessageToWs('noteUpdated', {
			id: data.body.id,
			type: data.type,
			body: data.body.body,
		});
	}

	/**
	 * チャンネル接続要求時
	 */
	@autobind
	private onChannelConnectRequested(payload: any) {
		const { channel, id, params } = payload;
		log(`CH CONNECT: ${id} ${channel} by @${this.user.username}`);
		this.connectChannel(id, params, (channels as any)[channel]);
	}

	/**
	 * チャンネル切断要求時
	 */
	@autobind
	private onChannelDisconnectRequested(payload: any) {
		const { id } = payload;
		log(`CH DISCONNECT: ${id} by @${this.user.username}`);
		this.disconnectChannel(id);
	}

	/**
	 * クライアントにメッセージ送信
	 */
	@autobind
	public sendMessageToWs(type: string, payload: any) {
		this.wsConnection.send(JSON.stringify({
			type: type,
			body: payload
		}));
	}

	/**
	 * チャンネルに接続
	 */
	@autobind
	private connectChannel(id: string, params: any, channelClass: { new(id: string, connection: Connection): Channel }) {
		const channel = new channelClass(id, this);
		this.channels.push(channel);
		channel.init(params);
	}

	/**
	 * チャンネルから切断
	 * @param id チャンネルコネクションID
	 */
	@autobind
	private disconnectChannel(id: string) {
		const channel = this.channels.find(c => c.id === id);

		if (channel) {
			if (channel.dispose) channel.dispose();
			this.channels = this.channels.filter(c => c.id !== id);
		}
	}

	/**
	 * チャンネルへメッセージ送信要求時
	 * @param data メッセージ
	 */
	@autobind
	private onChannelMessageRequested(data: any) {
		const channel = this.channels.find(c => c.id === data.id);
		if (channel != null && channel.onMessage != null) {
			channel.onMessage(data.type, data.body);
		}
	}

	/**
	 * ストリームが切れたとき
	 */
	@autobind
	public dispose() {
		this.channels.forEach(c => {
			if (c.dispose) c.dispose();
		});
	}
}
