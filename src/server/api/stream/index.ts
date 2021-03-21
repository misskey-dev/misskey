import autobind from 'autobind-decorator';
import * as websocket from 'websocket';
import { readNotification } from '../common/read-notification';
import call from '../call';
import readNote from '../../../services/note/read';
import Channel from './channel';
import channels from './channels';
import { EventEmitter } from 'events';
import { User } from '../../../models/entities/user';
import { Channel as ChannelModel } from '../../../models/entities/channel';
import { Users, Followings, Mutings, UserProfiles, ChannelFollowings } from '../../../models';
import { ApiError } from '../error';
import { AccessToken } from '../../../models/entities/access-token';
import { UserProfile } from '../../../models/entities/user-profile';
import { publishChannelStream, publishGroupMessagingStream, publishMessagingStream } from '../../../services/stream';
import { UserGroup } from '../../../models/entities/user-group';

/**
 * Main stream connection
 */
export default class Connection {
	public user?: User;
	public userProfile?: UserProfile;
	public following: Set<User['id']> = new Set();
	public muting: Set<User['id']> = new Set();
	public followingChannels: Set<ChannelModel['id']> = new Set();
	public token?: AccessToken;
	private wsConnection: websocket.connection;
	public subscriber: EventEmitter;
	private channels: Channel[] = [];
	private subscribingNotes: any = {};

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

		this.subscriber.on('broadcast', async ({ type, body }) => {
			this.onBroadcastMessage(type, body);
		});

		if (this.user) {
			this.updateFollowing();
			this.updateMuting();
			this.updateFollowingChannels();
			this.updateUserProfile();

			this.subscriber.on(`user:${this.user.id}`, ({ type, body }) => {
				this.onUserEvent(type, body);
			});
		}
	}

	@autobind
	private onUserEvent(type: string, body: any) {
		switch (type) {
			case 'follow':
				this.following.add(body.id);
				break;

			case 'unfollow':
				this.following.delete(body.id);
				break;

			case 'mute':
				this.muting.add(body.id);
				break;

			case 'unmute':
				this.muting.delete(body.id);
				break;

			case 'followChannel':
				this.followingChannels.add(body.id);
				break;

			case 'unfollowChannel':
				this.followingChannels.delete(body.id);
				break;

			case 'updateUserProfile':
				this.userProfile = body;
				break;

			default:
				break;
		}
	}

	/**
	 * クライアントからメッセージ受信時
	 */
	@autobind
	private async onWsConnectionMessage(data: websocket.IMessage) {
		if (data.utf8Data == null) return;

		let obj: Record<string, any>;

		try {
			obj = JSON.parse(data.utf8Data);
		} catch (e) {
			return;
		}

		const { type, body } = obj;

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

			// 個々のチャンネルではなくルートレベルでこれらのメッセージを受け取る理由は、
			// クライアントの事情を考慮したとき、入力フォームはノートチャンネルやメッセージのメインコンポーネントとは別
			// なこともあるため、それらのコンポーネントがそれぞれ各チャンネルに接続するようにするのは面倒なため。
			case 'typingOnChannel': this.typingOnChannel(body.channel); break;
			case 'typingOnMessaging': this.typingOnMessaging(body); break;
		}
	}

	@autobind
	private onBroadcastMessage(type: string, body: any) {
		this.sendMessageToWs(type, body);
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

		if (this.subscribingNotes[payload.id] === 1) {
			this.subscriber.on(`noteStream:${payload.id}`, this.onNoteStreamMessage);
		}

		if (this.user && read) {
			// TODO: クライアントでタイムライン読み込みなどすると、一度に大量のreadNoteが発生しクエリ数がすごいことになるので、ある程度まとめてreadNoteするようにする
			// 具体的には、この箇所ではキュー的な配列にread予定ノートを溜めておくに留めて、別の箇所で定期的にキューにあるノートを配列でreadNoteに渡すような実装にする
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
	private typingOnChannel(channel: ChannelModel['id']) {
		if (this.user) {
			publishChannelStream(channel, 'typing', this.user.id);
		}
	}

	@autobind
	private typingOnMessaging(param: { partner?: User['id']; group?: UserGroup['id']; }) {
		if (this.user) {
			if (param.partner) {
				publishMessagingStream(param.partner, this.user.id, 'typing', this.user.id);
			} else if (param.group) {
				publishGroupMessagingStream(param.group, 'typing', this.user.id);
			}
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

		this.following = new Set<string>(followings.map(x => x.followeeId));
	}

	@autobind
	private async updateMuting() {
		const mutings = await Mutings.find({
			where: {
				muterId: this.user!.id
			},
			select: ['muteeId']
		});

		this.muting = new Set<string>(mutings.map(x => x.muteeId));
	}

	@autobind
	private async updateFollowingChannels() {
		const followings = await ChannelFollowings.find({
			where: {
				followerId: this.user!.id
			},
			select: ['followeeId']
		});

		this.followingChannels = new Set<string>(followings.map(x => x.followeeId));
	}

	@autobind
	private async updateUserProfile() {
		this.userProfile = await UserProfiles.findOne({
			userId: this.user!.id
		});
	}

	/**
	 * ストリームが切れたとき
	 */
	@autobind
	public dispose() {
		for (const c of this.channels.filter(c => c.dispose)) {
			if (c.dispose) c.dispose();
		}
	}
}
