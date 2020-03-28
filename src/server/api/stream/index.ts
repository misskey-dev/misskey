import autobind from 'autobind-decorator';
import * as websocket from 'websocket';
import { readNotification } from '../common/read-notification';
import call from '../call';
import readNote from '../../../services/note/read';
import Channel from './channel';
import channels from './channels';
import { EventEmitter } from 'events';
import { User } from '../../../models/entities/user';
import { Users, Followings, Mutings } from '../../../models';
import { ApiError } from '../error';
import { AccessToken } from '../../../models/entities/access-token';

/**
 * Main stream connection
 */
export default class Connection {
	public user?: User;
	public following: User['id'][] = [];
	public muting: User['id'][] = [];
	public token: AccessToken;
	private wsConnection: websocket.connection;
	public subscriber: EventEmitter;
	private channels: Channel[] = [];
	private subscribingNotes: any = {};
	private followingClock: NodeJS.Timer;
	private mutingClock: NodeJS.Timer;

	constructor(
		wsConnection: websocket.connection,
		subscriber: EventEmitter,
		user: User | null | undefined,
		token: AccessToken | null | undefined
	) {
		this.wsConnection = wsConnection;
		this.subscriber = subscriber;
		if (user) this.user = user;
		if (token) this.token = token;

		this.wsConnection.on('message', this.onWsConnectionMessage);

		if (this.user) {
			this.updateFollowing();
			this.followingClock = setInterval(this.updateFollowing, 5000);

			this.updateMuting();
			this.mutingClock = setInterval(this.updateMuting, 5000);
		}
	}

	/**
	 * クライアントからメッセージ受信時
	 */
	@autobind
	private async onWsConnectionMessage(data: websocket.IMessage) {
		if (data.utf8Data == null) return;

		const { type, body } = JSON.parse(data.utf8Data);

		switch (type) {
			case 'api': this.onApiRequest(body); break;
			case 'readNotification': this.onReadNotification(body); break;
			case 'subNote': this.onSubscribeNote(body, true); break;
			case 'sn': this.onSubscribeNote(body, true); break; // alias
			case 's': this.onSubscribeNote(body, false); break;
			case 'unsubNote': this.onUnsubscribeNote(body); break;
			case 'un': this.onUnsubscribeNote(body); break; // alias
			case 'connect': this.onChannelConnectRequested(body); break;
			case 'disconnect': this.onChannelDisconnectRequested(body); break;
			case 'channel': this.onChannelMessageRequested(body); break;
			case 'ch': this.onChannelMessageRequested(body); break; // alias
		}
	}

	/**
	 * APIリクエスト要求時
	 */
	@autobind
	private async onApiRequest(payload: any) {
		// 新鮮なデータを利用するためにユーザーをフェッチ
		const user = this.user ? await Users.findOne(this.user.id) : null;

		const endpoint = payload.endpoint || payload.ep; // alias

		// 呼び出し
		call(endpoint, user, this.token, payload.data).then(res => {
			this.sendMessageToWs(`api:${payload.id}`, { res });
		}).catch((e: ApiError) => {
			this.sendMessageToWs(`api:${payload.id}`, {
				error: {
					message: e.message,
					code: e.code,
					id: e.id,
					kind: e.kind,
					...(e.info ? { info: e.info } : {})
				}
			});
		});
	}

	@autobind
	private onReadNotification(payload: any) {
		if (!payload.id) return;
		readNotification(this.user!.id, [payload.id]);
	}

	/**
	 * 投稿購読要求時
	 */
	@autobind
	private onSubscribeNote(payload: any, read: boolean) {
		if (!payload.id) return;

		if (this.subscribingNotes[payload.id] == null) {
			this.subscribingNotes[payload.id] = 0;
		}

		this.subscribingNotes[payload.id]++;

		if (this.subscribingNotes[payload.id] == 1) {
			this.subscriber.on(`noteStream:${payload.id}`, this.onNoteStreamMessage);
		}

		if (this.user && read) {
			readNote(this.user.id, payload.id);
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
		const { channel, id, params, pong } = payload;
		this.connectChannel(id, params, channel, pong);
	}

	/**
	 * チャンネル切断要求時
	 */
	@autobind
	private onChannelDisconnectRequested(payload: any) {
		const { id } = payload;
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
	public connectChannel(id: string, params: any, channel: string, pong = false) {
		if ((channels as any)[channel].requireCredential && this.user == null) {
			return;
		}

		// 共有可能チャンネルに接続しようとしていて、かつそのチャンネルに既に接続していたら無意味なので無視
		if ((channels as any)[channel].shouldShare && this.channels.some(c => c.chName === channel)) {
			return;
		}

		const ch: Channel = new (channels as any)[channel](id, this);
		this.channels.push(ch);
		ch.init(params);

		if (pong) {
			this.sendMessageToWs('connected', {
				id: id
			});
		}
	}

	/**
	 * チャンネルから切断
	 * @param id チャンネルコネクションID
	 */
	@autobind
	public disconnectChannel(id: string) {
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

	@autobind
	private async updateFollowing() {
		const followings = await Followings.find({
			where: {
				followerId: this.user!.id
			},
			select: ['followeeId']
		});

		this.following = followings.map(x => x.followeeId);
	}

	@autobind
	private async updateMuting() {
		const mutings = await Mutings.find({
			where: {
				muterId: this.user!.id
			},
			select: ['muteeId']
		});

		this.muting = mutings.map(x => x.muteeId);
	}

	/**
	 * ストリームが切れたとき
	 */
	@autobind
	public dispose() {
		for (const c of this.channels.filter(c => c.dispose)) {
			if (c.dispose) c.dispose();
		}

		if (this.followingClock) clearInterval(this.followingClock);
		if (this.mutingClock) clearInterval(this.mutingClock);
	}
}
