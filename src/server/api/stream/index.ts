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

export default class Connection {
	public request: websocket.request;
	public user: IUser;
	public app: IApp;
	private wsConnection: websocket.connection;
	public subscriber: Xev;

	constructor(
		request: websocket.request,
		wsConnection: websocket.connection,
		subscriber: Xev,
		user: IUser,
		app: IApp
	) {
		this.request = request;
		this.wsConnection = wsConnection;
		this.user = user;
		this.app = app;
		this.subscriber = subscriber;

		this.wsConnection.on('message', this.onWsConnectionMessage);
	}

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
		}
	}

	private onApiRequest = async (data: any) => {
		// 新鮮なデータを利用するためにユーザーをフェッチ
		call(data.endpoint, await User.findOne({ _id: this.user._id }), this.app, data.data).then(res => {
			this.sendMessageToWs(`api-res:${data.id}`, { res });
		}).catch(e => {
			this.sendMessageToWs(`api-res:${data.id}`, { e });
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

	private onSubscribeNote = (data: any) => {
		if (!data.id) return;
		log(`CAPTURE: ${data.id} by @${this.user.username}`);
		this.subscriber.on(`note-stream:${data.id}`, this.onNoteStreamMessage);
		if (data.read) {
			readNote(this.user._id, data.id);
		}
	}

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

	private onChannelConnectRequested = (data: any) => {
		const { channel } = data;

		switch (channel) {
			case 'homeTimeline': homeTimeline(this); break;
		}
	}

	private sendMessageToWs = (type: string, payload: any) => {
		this.wsConnection.send(JSON.stringify({
			type: type,
			body: payload
		}));
	}
}
