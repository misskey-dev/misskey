import { EventEmitter } from 'events';
import * as websocket from 'websocket';
import readNote from '@/services/note/read.js';
import { User } from '@/models/entities/user.js';
import { Channel as ChannelModel } from '@/models/entities/channel.js';
import { Users, Followings, Mutings, UserProfiles, ChannelFollowings, Blockings } from '@/models/index.js';
import { AccessToken } from '@/models/entities/access-token.js';
import { UserProfile } from '@/models/entities/user-profile.js';
import { publishChannelStream, publishGroupMessagingStream, publishMessagingStream } from '@/services/stream.js';
import { UserGroup } from '@/models/entities/user-group.js';
import { Packed } from '@/misc/schema.js';
import { readNotification } from '../common/read-notification.js';
import channels from './channels/index.js';
import Channel from './channel.js';
import { StreamEventEmitter, StreamMessages } from './types.js';

/**
 * Main stream connection
 */
export default class Connection {
	public user?: User;
	public userProfile?: UserProfile | null;
	public following: Set<User['id']> = new Set();
	public muting: Set<User['id']> = new Set();
	public blocking: Set<User['id']> = new Set(); // "被"blocking
	public followingChannels: Set<ChannelModel['id']> = new Set();
	public token?: AccessToken;
	private wsConnection: websocket.connection;
	public subscriber: StreamEventEmitter;
	private channels: Channel[] = [];
	private subscribingNotes: any = {};
	private cachedNotes: Packed<'Note'>[] = [];

	constructor(
		wsConnection: websocket.connection,
		subscriber: EventEmitter,
		user: User | null | undefined,
		token: AccessToken | null | undefined,
	) {
		this.wsConnection = wsConnection;
		this.subscriber = subscriber;
		if (user) this.user = user;
		if (token) this.token = token;

		this.onWsConnectionMessage = this.onWsConnectionMessage.bind(this);
		this.onUserEvent = this.onUserEvent.bind(this);
		this.onNoteStreamMessage = this.onNoteStreamMessage.bind(this);
		this.onBroadcastMessage = this.onBroadcastMessage.bind(this);

		this.wsConnection.on('message', this.onWsConnectionMessage);

		this.subscriber.on('broadcast', data => {
			this.onBroadcastMessage(data);
		});

		if (this.user) {
			this.updateFollowing();
			this.updateMuting();
			this.updateBlocking();
			this.updateFollowingChannels();
			this.updateUserProfile();

			this.subscriber.on(`user:${this.user.id}`, this.onUserEvent);
		}
	}

	private onUserEvent(data: StreamMessages['user']['payload']) { // { type, body }と展開するとそれぞれ型が分離してしまう
		switch (data.type) {
			case 'follow':
				this.following.add(data.body.id);
				break;

			case 'unfollow':
				this.following.delete(data.body.id);
				break;

			case 'mute':
				this.muting.add(data.body.id);
				break;

			case 'unmute':
				this.muting.delete(data.body.id);
				break;

				// TODO: block events

			case 'followChannel':
				this.followingChannels.add(data.body.id);
				break;

			case 'unfollowChannel':
				this.followingChannels.delete(data.body.id);
				break;

			case 'updateUserProfile':
				this.userProfile = data.body;
				break;

			case 'terminate':
				this.wsConnection.close();
				this.dispose();
				break;

			default:
				break;
		}
	}

	/**
	 * クライアントからメッセージ受信時
	 */
	private async onWsConnectionMessage(data: websocket.Message) {
		if (data.type !== 'utf8') return;
		if (data.utf8Data == null) return;

		let obj: Record<string, any>;

		try {
			obj = JSON.parse(data.utf8Data);
		} catch (e) {
			return;
		}

		const { type, body } = obj;

		switch (type) {
			case 'readNotification': this.onReadNotification(body); break;
			case 'subNote': this.onSubscribeNote(body); break;
			case 's': this.onSubscribeNote(body); break; // alias
			case 'sr': this.onSubscribeNote(body); this.readNote(body); break;
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

	private onBroadcastMessage(data: StreamMessages['broadcast']['payload']) {
		this.sendMessageToWs(data.type, data.body);
	}

	public cacheNote(note: Packed<'Note'>) {
		const add = (note: Packed<'Note'>) => {
			const existIndex = this.cachedNotes.findIndex(n => n.id === note.id);
			if (existIndex > -1) {
				this.cachedNotes[existIndex] = note;
				return;
			}

			this.cachedNotes.unshift(note);
			if (this.cachedNotes.length > 32) {
				this.cachedNotes.splice(32);
			}
		};

		add(note);
		if (note.reply) add(note.reply);
		if (note.renote) add(note.renote);
	}

	private readNote(body: any) {
		const id = body.id;

		const note = this.cachedNotes.find(n => n.id === id);
		if (note == null) return;

		if (this.user && (note.userId !== this.user.id)) {
			readNote(this.user.id, [note], {
				following: this.following,
				followingChannels: this.followingChannels,
			});
		}
	}

	private onReadNotification(payload: any) {
		if (!payload.id) return;
		readNotification(this.user!.id, [payload.id]);
	}

	/**
	 * 投稿購読要求時
	 */
	private onSubscribeNote(payload: any) {
		if (!payload.id) return;

		if (this.subscribingNotes[payload.id] == null) {
			this.subscribingNotes[payload.id] = 0;
		}

		this.subscribingNotes[payload.id]++;

		if (this.subscribingNotes[payload.id] === 1) {
			this.subscriber.on(`noteStream:${payload.id}`, this.onNoteStreamMessage);
		}
	}

	/**
	 * 投稿購読解除要求時
	 */
	private onUnsubscribeNote(payload: any) {
		if (!payload.id) return;

		this.subscribingNotes[payload.id]--;
		if (this.subscribingNotes[payload.id] <= 0) {
			delete this.subscribingNotes[payload.id];
			this.subscriber.off(`noteStream:${payload.id}`, this.onNoteStreamMessage);
		}
	}

	private async onNoteStreamMessage(data: StreamMessages['note']['payload']) {
		this.sendMessageToWs('noteUpdated', {
			id: data.body.id,
			type: data.type,
			body: data.body.body,
		});
	}

	/**
	 * チャンネル接続要求時
	 */
	private onChannelConnectRequested(payload: any) {
		const { channel, id, params, pong } = payload;
		this.connectChannel(id, params, channel, pong);
	}

	/**
	 * チャンネル切断要求時
	 */
	private onChannelDisconnectRequested(payload: any) {
		const { id } = payload;
		this.disconnectChannel(id);
	}

	/**
	 * クライアントにメッセージ送信
	 */
	public sendMessageToWs(type: string, payload: any) {
		this.wsConnection.send(JSON.stringify({
			type: type,
			body: payload,
		}));
	}

	/**
	 * チャンネルに接続
	 */
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
				id: id,
			});
		}
	}

	/**
	 * チャンネルから切断
	 * @param id チャンネルコネクションID
	 */
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
	private onChannelMessageRequested(data: any) {
		const channel = this.channels.find(c => c.id === data.id);
		if (channel != null && channel.onMessage != null) {
			channel.onMessage(data.type, data.body);
		}
	}

	private typingOnChannel(channel: ChannelModel['id']) {
		if (this.user) {
			publishChannelStream(channel, 'typing', this.user.id);
		}
	}

	private typingOnMessaging(param: { partner?: User['id']; group?: UserGroup['id']; }) {
		if (this.user) {
			if (param.partner) {
				publishMessagingStream(param.partner, this.user.id, 'typing', this.user.id);
			} else if (param.group) {
				publishGroupMessagingStream(param.group, 'typing', this.user.id);
			}
		}
	}

	private async updateFollowing() {
		const followings = await Followings.find({
			where: {
				followerId: this.user!.id,
			},
			select: ['followeeId'],
		});

		this.following = new Set<string>(followings.map(x => x.followeeId));
	}

	private async updateMuting() {
		const mutings = await Mutings.find({
			where: {
				muterId: this.user!.id,
			},
			select: ['muteeId'],
		});

		this.muting = new Set<string>(mutings.map(x => x.muteeId));
	}

	private async updateBlocking() { // ここでいうBlockingは被Blockingの意
		const blockings = await Blockings.find({
			where: {
				blockeeId: this.user!.id,
			},
			select: ['blockerId'],
		});

		this.blocking = new Set<string>(blockings.map(x => x.blockerId));
	}

	private async updateFollowingChannels() {
		const followings = await ChannelFollowings.find({
			where: {
				followerId: this.user!.id,
			},
			select: ['followeeId'],
		});

		this.followingChannels = new Set<string>(followings.map(x => x.followeeId));
	}

	private async updateUserProfile() {
		this.userProfile = await UserProfiles.findOneBy({
			userId: this.user!.id,
		});
	}

	/**
	 * ストリームが切れたとき
	 */
	public dispose() {
		for (const c of this.channels.filter(c => c.dispose)) {
			if (c.dispose) c.dispose();
		}
	}
}
