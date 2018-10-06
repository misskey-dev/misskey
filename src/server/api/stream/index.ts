import * as websocket from 'websocket';
import Xev from 'xev';
import * as debug from 'debug';

import User, { IUser } from '../../../models/user';
import { pack as packNote } from '../../../models/note';
import readNotification from '../common/read-notification';
import call from '../call';
import { IApp } from '../../../models/app';
import readNote from '../../../services/note/read';

import homeTimeline from './home-timeline';

const log = debug('misskey');

/**
 * Main stream connection
 */
export default class Connection {
	public user: IUser;
	public app: IApp;
	private wsConnection: websocket.connection;
	public subscriber: Xev;
	private channels: Channel[] = [];

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
	private onWsConnectionMessage = async (data: websocket.IMessage) => {
		const { type, body } = JSON.parse(data.utf8Data);

		switch (type) {
			case 'api': this.onApiRequest(body); break;
			case 'alive': this.onAlive(); break;
			case 'readNotification': this.onReadNotification(body); break;
			case 'subNote': this.onSubscribeNote(body); break;
			case 'unsubNote': this.onUnsubscribeNote(body); break;
			case 'connect': this.onChannelConnectRequested(body); break;
			case 'disconnect': this.onChannelDisconnectRequested(body); break;
			case 'channel': this.onChannelMessageRequested(body); break;
		}
	}

	/**
	 * APIリクエスト要求時
	 */
	private onApiRequest = async (data: any) => {
		// 新鮮なデータを利用するためにユーザーをフェッチ
		call(data.endpoint, await User.findOne({ _id: this.user._id }), this.app, data.data).then(res => {
			this.sendMessageToWs(`api:${data.id}`, { res });
		}).catch(e => {
			this.sendMessageToWs(`api:${data.id}`, { e });
		});
	}

	private onAlive = () => {
		// Update lastUsedAt
		User.update({ _id: this.user._id }, {
			$set: {
				'lastUsedAt': new Date()
			}
		});
	}

	private onReadNotification = (data: any) => {
		if (!data.id) return;
		readNotification(this.user._id, data.id);
	}

	/**
	 * 投稿購読要求時
	 */
	private onSubscribeNote = (data: any) => {
		if (!data.id) return;
		log(`CAPTURE: ${data.id} by @${this.user.username}`);
		this.subscriber.on(`note-stream:${data.id}`, this.onNoteStreamMessage);
		if (data.read) {
			readNote(this.user._id, data.id);
		}
	}

	/**
	 * 投稿購読解除要求時
	 */
	private onUnsubscribeNote = (data: any) => {
		if (!data.id) return;
		log(`DECAPTURE: ${data.id} by @${this.user.username}`);
		this.subscriber.off(`note-stream:${data.id}`, this.onNoteStreamMessage);
	}

	private onNoteStreamMessage = async (noteId: any) => {
		const note = await packNote(noteId, this.user, {
			detail: true
		});

		this.sendMessageToWs('note-updated', {
			note: note
		});
	}

	/**
	 * チャンネル接続要求時
	 */
	private onChannelConnectRequested = (data: any) => {
		const { channel, id, params } = data;

		switch (channel) {
			case 'homeTimeline': this.connectChannel(id, params, homeTimeline); break;
		}
	}

	/**
	 * チャンネル切断要求時
	 */
	private onChannelDisconnectRequested = (data: any) => {
		const { id } = data;

		this.disconnectChannel(id);
	}

	/**
	 * クライアントにメッセージ送信
	 */
	public sendMessageToWs = (type: string, payload: any) => {
		this.wsConnection.send(JSON.stringify({
			type: type,
			body: payload
		}));
	}

	/**
	 * チャンネルに接続
	 */
	private connectChannel = (id: string, params: any, channelClass: { new(id: string, connection: Connection): Channel }) => {
		const channel = new channelClass(id, this);
		this.channels.push(channel);
		channel.init(params);
	}

	/**
	 * チャンネルから切断
	 */
	private disconnectChannel = (id: string) => {
		const channel = this.channels.find(c => c.id === id);

		if (channel) {
			if (channel.dispose) channel.dispose();
			this.channels = this.channels.filter(c => c.id !== id);
		}
	}

	private onChannelMessageRequested = (data: any) => {
		const channel = this.channels.find(c => c.id === data.id);
		channel.onMessage(data.type, data.body);
	}

	/**
	 * ストリームが切れたとき
	 */
	public dispose = () => {
		this.channels.forEach(c => {
			if (c.dispose) c.dispose();
		});
	}
}

/**
 * Stream channel
 */
export abstract class Channel {
	protected connection: Connection;
	public id: string;

	constructor(id: string, connection: Connection) {
		this.id = id;
		this.connection = connection;
	}

	public send = (typeOrPayload: any, payload?: any) => {
		const data = payload === undefined ? typeOrPayload : {
			type: typeOrPayload,
			body: payload
		};

		this.connection.sendMessageToWs('channel', {
			id: this.id,
			data: data
		});
	}

	public abstract init: (params: any) => void;
	public dispose?: () => void;
	public onMessage?: (type: string, body: any) => void;
}
