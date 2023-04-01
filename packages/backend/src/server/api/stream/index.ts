import type { User } from '@/models/entities/User.js';
import type { Channel as ChannelModel } from '@/models/entities/Channel.js';
import type { FollowingsRepository, MutingsRepository, RenoteMutingsRepository, UserProfilesRepository, ChannelFollowingsRepository, BlockingsRepository } from '@/models/index.js';
import type { AccessToken } from '@/models/entities/AccessToken.js';
import type { UserProfile } from '@/models/entities/UserProfile.js';
import type { Packed } from '@/misc/json-schema.js';
import type { GlobalEventService } from '@/core/GlobalEventService.js';
import type { NoteReadService } from '@/core/NoteReadService.js';
import type { NotificationService } from '@/core/NotificationService.js';
import { bindThis } from '@/decorators.js';
import type { ChannelsService } from './ChannelsService.js';
import type * as websocket from 'websocket';
import type { EventEmitter } from 'events';
import type Channel from './channel.js';
import type { StreamEventEmitter, StreamMessages } from './types.js';

/**
 * Main stream connection
 */
export default class Connection {
	public user?: User;
	public userProfile?: UserProfile | null;
	public following: Set<User['id']> = new Set();
	public muting: Set<User['id']> = new Set();
	public renoteMuting: Set<User['id']> = new Set();
	public blocking: Set<User['id']> = new Set(); // "被"blocking
	public followingChannels: Set<ChannelModel['id']> = new Set();
	public token?: AccessToken;
	private wsConnection: websocket.connection;
	public subscriber: StreamEventEmitter;
	private channels: Channel[] = [];
	private subscribingNotes: any = {};
	private cachedNotes: Packed<'Note'>[] = [];

	constructor(
		private followingsRepository: FollowingsRepository,
		private mutingsRepository: MutingsRepository,
		private renoteMutingsRepository: RenoteMutingsRepository,
		private blockingsRepository: BlockingsRepository,
		private channelFollowingsRepository: ChannelFollowingsRepository,
		private userProfilesRepository: UserProfilesRepository,
		private channelsService: ChannelsService,
		private globalEventService: GlobalEventService,
		private noteReadService: NoteReadService,
		private notificationService: NotificationService,

		wsConnection: websocket.connection,
		subscriber: EventEmitter,
		user: User | null | undefined,
		token: AccessToken | null | undefined,
	) {
		this.wsConnection = wsConnection;
		this.subscriber = subscriber;
		if (user) this.user = user;
		if (token) this.token = token;

		//this.onWsConnectionMessage = this.onWsConnectionMessage.bind(this);
		//this.onUserEvent = this.onUserEvent.bind(this);
		//this.onNoteStreamMessage = this.onNoteStreamMessage.bind(this);
		//this.onBroadcastMessage = this.onBroadcastMessage.bind(this);

		this.wsConnection.on('message', this.onWsConnectionMessage);

		this.subscriber.on('broadcast', data => {
			this.onBroadcastMessage(data);
		});

		if (this.user) {
			this.updateFollowing();
			this.updateMuting();
			this.updateRenoteMuting();
			this.updateBlocking();
			this.updateFollowingChannels();
			this.updateUserProfile();

			this.subscriber.on(`user:${this.user.id}`, this.onUserEvent);
		}
	}

	@bindThis
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

				// TODO: renote mute events
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
	@bindThis
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
		}
	}

	@bindThis
	private onBroadcastMessage(data: StreamMessages['broadcast']['payload']) {
		this.sendMessageToWs(data.type, data.body);
	}

	@bindThis
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

	@bindThis
	private readNote(body: any) {
		const id = body.id;

		const note = this.cachedNotes.find(n => n.id === id);
		if (note == null) return;

		if (this.user && (note.userId !== this.user.id)) {
			this.noteReadService.read(this.user.id, [note], {
				following: this.following,
				followingChannels: this.followingChannels,
			});
		}
	}

	@bindThis
	private onReadNotification(payload: any) {
		if (!payload.id) return;
		this.notificationService.readNotification(this.user!.id, [payload.id]);
	}

	/**
	 * 投稿購読要求時
	 */
	@bindThis
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
	@bindThis
	private onUnsubscribeNote(payload: any) {
		if (!payload.id) return;

		this.subscribingNotes[payload.id]--;
		if (this.subscribingNotes[payload.id] <= 0) {
			delete this.subscribingNotes[payload.id];
			this.subscriber.off(`noteStream:${payload.id}`, this.onNoteStreamMessage);
		}
	}

	@bindThis
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
	@bindThis
	private onChannelConnectRequested(payload: any) {
		const { channel, id, params, pong } = payload;
		this.connectChannel(id, params, channel, pong);
	}

	/**
	 * チャンネル切断要求時
	 */
	@bindThis
	private onChannelDisconnectRequested(payload: any) {
		const { id } = payload;
		this.disconnectChannel(id);
	}

	/**
	 * クライアントにメッセージ送信
	 */
	@bindThis
	public sendMessageToWs(type: string, payload: any) {
		this.wsConnection.send(JSON.stringify({
			type: type,
			body: payload,
		}));
	}

	/**
	 * チャンネルに接続
	 */
	@bindThis
	public connectChannel(id: string, params: any, channel: string, pong = false) {
		const channelService = this.channelsService.getChannelService(channel);

		if (channelService.requireCredential && this.user == null) {
			return;
		}

		// 共有可能チャンネルに接続しようとしていて、かつそのチャンネルに既に接続していたら無意味なので無視
		if (channelService.shouldShare && this.channels.some(c => c.chName === channel)) {
			return;
		}

		const ch: Channel = channelService.create(id, this);
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
	@bindThis
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
	@bindThis
	private onChannelMessageRequested(data: any) {
		const channel = this.channels.find(c => c.id === data.id);
		if (channel != null && channel.onMessage != null) {
			channel.onMessage(data.type, data.body);
		}
	}

	@bindThis
	private async updateFollowing() {
		const followings = await this.followingsRepository.find({
			where: {
				followerId: this.user!.id,
			},
			select: ['followeeId'],
		});

		this.following = new Set<string>(followings.map(x => x.followeeId));
	}

	@bindThis
	private async updateMuting() {
		const mutings = await this.mutingsRepository.find({
			where: {
				muterId: this.user!.id,
			},
			select: ['muteeId'],
		});

		this.muting = new Set<string>(mutings.map(x => x.muteeId));
	}

	@bindThis
	private async updateRenoteMuting() {
		const renoteMutings = await this.renoteMutingsRepository.find({
			where: {
				muterId: this.user!.id,
			},
			select: ['muteeId'],
		});

		this.renoteMuting = new Set<string>(renoteMutings.map(x => x.muteeId));
	}

	@bindThis
	private async updateBlocking() { // ここでいうBlockingは被Blockingの意
		const blockings = await this.blockingsRepository.find({
			where: {
				blockeeId: this.user!.id,
			},
			select: ['blockerId'],
		});

		this.blocking = new Set<string>(blockings.map(x => x.blockerId));
	}

	@bindThis
	private async updateFollowingChannels() {
		const followings = await this.channelFollowingsRepository.find({
			where: {
				followerId: this.user!.id,
			},
			select: ['followeeId'],
		});

		this.followingChannels = new Set<string>(followings.map(x => x.followeeId));
	}

	@bindThis
	private async updateUserProfile() {
		this.userProfile = await this.userProfilesRepository.findOneBy({
			userId: this.user!.id,
		});
	}

	/**
	 * ストリームが切れたとき
	 */
	@bindThis
	public dispose() {
		for (const c of this.channels.filter(c => c.dispose)) {
			if (c.dispose) c.dispose();
		}
	}
}
