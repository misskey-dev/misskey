/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as WebSocket from 'ws';
import type { MiUser } from '@/models/User.js';
import type { MiAccessToken } from '@/models/AccessToken.js';
import { NotificationService } from '@/core/NotificationService.js';
import { bindThis } from '@/decorators.js';
import { CacheService } from '@/core/CacheService.js';
import { MiFollowing, MiUserProfile } from '@/models/_.js';
import type { GlobalEvents, StreamEventEmitter } from '@/core/GlobalEventService.js';
import { ChannelFollowingService } from '@/core/ChannelFollowingService.js';
import { ChannelMutingService } from '@/core/ChannelMutingService.js';
import type { JsonObject, JsonValue } from '@/misc/json-value.js';
import { isJsonObject } from '@/misc/json-value.js';
import type { EventEmitter } from 'events';
import type Channel from './channel.js';
import type { ChannelConstructor } from './channel.js';
import type { ChannelRequest } from './channel.js';
import { ContextIdFactory, ModuleRef, REQUEST } from '@nestjs/core';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { MainChannel } from '@/server/api/stream/channels/main.js';
import { HomeTimelineChannel } from '@/server/api/stream/channels/home-timeline.js';
import { LocalTimelineChannel } from '@/server/api/stream/channels/local-timeline.js';
import { HybridTimelineChannel } from '@/server/api/stream/channels/hybrid-timeline.js';
import { GlobalTimelineChannel } from '@/server/api/stream/channels/global-timeline.js';
import { UserListChannel } from '@/server/api/stream/channels/user-list.js';
import { HashtagChannel } from '@/server/api/stream/channels/hashtag.js';
import { RoleTimelineChannel } from '@/server/api/stream/channels/role-timeline.js';
import { AntennaChannel } from '@/server/api/stream/channels/antenna.js';
import { ChannelChannel } from '@/server/api/stream/channels/channel.js';
import { DriveChannel } from '@/server/api/stream/channels/drive.js';
import { ServerStatsChannel } from '@/server/api/stream/channels/server-stats.js';
import { QueueStatsChannel } from '@/server/api/stream/channels/queue-stats.js';
import { AdminChannel } from '@/server/api/stream/channels/admin.js';
import { ChatUserChannel } from '@/server/api/stream/channels/chat-user.js';
import { ChatRoomChannel } from '@/server/api/stream/channels/chat-room.js';
import { ReversiChannel } from '@/server/api/stream/channels/reversi.js';
import { ReversiGameChannel } from '@/server/api/stream/channels/reversi-game.js';

const MAX_CHANNELS_PER_CONNECTION = 32;

/**
 * Main stream connection
 */
// eslint-disable-next-line import/no-default-export
@Injectable({ scope: Scope.TRANSIENT })
export default class Connection {
	public user?: MiUser;
	public token?: MiAccessToken;
	private wsConnection: WebSocket.WebSocket;
	public subscriber: StreamEventEmitter;
	private channels: Channel[] = [];
	private subscribingNotes: Partial<Record<string, number>> = {};
	public userProfile: MiUserProfile | null = null;
	public following: Record<string, Pick<MiFollowing, 'withReplies'> | undefined> = {};
	public followingChannels: Set<string> = new Set();
	public mutingChannels: Set<string> = new Set();
	public userIdsWhoMeMuting: Set<string> = new Set();
	public userIdsWhoBlockingMe: Set<string> = new Set();
	public userIdsWhoMeMutingRenotes: Set<string> = new Set();
	public userMutedInstances: Set<string> = new Set();
	private fetchIntervalId: NodeJS.Timeout | null = null;

	constructor(
		private moduleRef: ModuleRef,
		private notificationService: NotificationService,
		private cacheService: CacheService,
		private channelFollowingService: ChannelFollowingService,
		private channelMutingService: ChannelMutingService,
		@Inject(REQUEST)
		request: ConnectionRequest,
	) {
		if (request.user) this.user = request.user;
		if (request.token) this.token = request.token;
	}

	@bindThis
	public async fetch() {
		if (this.user == null) return;
		const [
			userProfile,
			following,
			followingChannels,
			mutingChannels,
			userIdsWhoMeMuting,
			userIdsWhoBlockingMe,
			userIdsWhoMeMutingRenotes,
		] = await Promise.all([
			this.cacheService.userProfileCache.fetch(this.user.id),
			this.cacheService.userFollowingsCache.fetch(this.user.id),
			this.channelFollowingService.userFollowingChannelsCache.fetch(this.user.id),
			this.channelMutingService.mutingChannelsCache.fetch(this.user.id),
			this.cacheService.userMutingsCache.fetch(this.user.id),
			this.cacheService.userBlockedCache.fetch(this.user.id),
			this.cacheService.renoteMutingsCache.fetch(this.user.id),
		]);
		this.userProfile = userProfile;
		this.following = following;
		this.followingChannels = followingChannels;
		this.mutingChannels = mutingChannels;
		this.userIdsWhoMeMuting = userIdsWhoMeMuting;
		this.userIdsWhoBlockingMe = userIdsWhoBlockingMe;
		this.userIdsWhoMeMutingRenotes = userIdsWhoMeMutingRenotes;
		this.userMutedInstances = new Set(userProfile.mutedInstances);
	}

	@bindThis
	public async init() {
		if (this.user != null) {
			await this.fetch();

			if (!this.fetchIntervalId) {
				this.fetchIntervalId = setInterval(this.fetch, 1000 * 10);
			}
		}
	}

	@bindThis
	public async listen(subscriber: EventEmitter, wsConnection: WebSocket.WebSocket) {
		this.subscriber = subscriber;

		this.wsConnection = wsConnection;
		this.wsConnection.on('message', this.onWsConnectionMessage);

		this.subscriber.on('broadcast', data => {
			this.onBroadcastMessage(data);
		});
	}

	/**
	 * クライアントからメッセージ受信時
	 */
	@bindThis
	private async onWsConnectionMessage(data: WebSocket.RawData) {
		let obj: JsonObject;

		try {
			obj = JSON.parse(data.toString());
		} catch (_) {
			return;
		}

		const { type, body } = obj;

		switch (type) {
			case 'readNotification': this.onReadNotification(body); break;
			case 'subNote': this.onSubscribeNote(body); break;
			case 's': this.onSubscribeNote(body); break; // alias
			case 'sr': this.onSubscribeNote(body); break;
			case 'unsubNote': this.onUnsubscribeNote(body); break;
			case 'un': this.onUnsubscribeNote(body); break; // alias
			case 'connect': this.onChannelConnectRequested(body); break;
			case 'disconnect': this.onChannelDisconnectRequested(body); break;
			case 'channel': this.onChannelMessageRequested(body); break;
			case 'ch': this.onChannelMessageRequested(body); break; // alias
		}
	}

	@bindThis
	private onBroadcastMessage(data: GlobalEvents['broadcast']['payload']) {
		this.sendMessageToWs(data.type, data.body);
	}

	@bindThis
	private onReadNotification(payload: JsonValue | undefined) {
		this.notificationService.readAllNotification(this.user!.id);
	}

	/**
	 * 投稿購読要求時
	 */
	@bindThis
	private onSubscribeNote(payload: JsonValue | undefined) {
		if (!isJsonObject(payload)) return;
		if (!payload.id || typeof payload.id !== 'string') return;

		const current = this.subscribingNotes[payload.id] ?? 0;
		const updated = current + 1;
		this.subscribingNotes[payload.id] = updated;

		if (updated === 1) {
			this.subscriber.on(`noteStream:${payload.id}`, this.onNoteStreamMessage);
		}
	}

	/**
	 * 投稿購読解除要求時
	 */
	@bindThis
	private onUnsubscribeNote(payload: JsonValue | undefined) {
		if (!isJsonObject(payload)) return;
		if (!payload.id || typeof payload.id !== 'string') return;

		const current = this.subscribingNotes[payload.id];
		if (current == null) return;
		const updated = current - 1;
		this.subscribingNotes[payload.id] = updated;
		if (updated <= 0) {
			delete this.subscribingNotes[payload.id];
			this.subscriber.off(`noteStream:${payload.id}`, this.onNoteStreamMessage);
		}
	}

	@bindThis
	private async onNoteStreamMessage(data: GlobalEvents['note']['payload']) {
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
	private onChannelConnectRequested(payload: JsonValue | undefined) {
		if (!isJsonObject(payload)) return;
		const { channel, id, params, pong } = payload;
		if (typeof id !== 'string') return;
		if (typeof channel !== 'string') return;
		if (typeof pong !== 'boolean' && typeof pong !== 'undefined' && pong !== null) return;
		if (typeof params !== 'undefined' && !isJsonObject(params)) return;
		this.connectChannel(id, params, channel, pong ?? undefined);
	}

	/**
	 * チャンネル切断要求時
	 */
	@bindThis
	private onChannelDisconnectRequested(payload: JsonValue | undefined) {
		if (!isJsonObject(payload)) return;
		const { id } = payload;
		if (typeof id !== 'string') return;
		this.disconnectChannel(id);
	}

	/**
	 * クライアントにメッセージ送信
	 */
	@bindThis
	public sendMessageToWs(type: string, payload: JsonObject) {
		this.wsConnection.send(JSON.stringify({
			type: type,
			body: payload,
		}));
	}

	/**
	 * チャンネルに接続
	 */
	@bindThis
	public async connectChannel(id: string, params: JsonObject | undefined, channel: string, pong = false) {
		if (this.channels.length >= MAX_CHANNELS_PER_CONNECTION) {
			return;
		}

		const channelConstructor = this.getChannelConstructor(channel);

		if (channelConstructor.requireCredential && this.user == null) {
			return;
		}

		if (this.token && ((channelConstructor.kind && !this.token.permission.some(p => p === channelConstructor.kind))
			|| (!channelConstructor.kind && channelConstructor.requireCredential))) {
			return;
		}

		// 共有可能チャンネルに接続しようとしていて、かつそのチャンネルに既に接続していたら無意味なので無視
		if (channelConstructor.shouldShare && this.channels.some(c => c.chName === channel)) {
			return;
		}

		const contextId = ContextIdFactory.create();
		this.moduleRef.registerRequestByContextId<ChannelRequest>({
			id: id,
			connection: this,
		}, contextId);
		const ch: Channel = await this.moduleRef.create<Channel>(channelConstructor, contextId);

		this.channels.push(ch);
		ch.init(params ?? {});

		if (pong) {
			this.sendMessageToWs('connected', {
				id: id,
			});
		}
	}

	@bindThis
	public getChannelConstructor(name: string): ChannelConstructor<boolean> {
		switch (name) {
			case 'main': return MainChannel;
			case 'homeTimeline': return HomeTimelineChannel;
			case 'localTimeline': return LocalTimelineChannel;
			case 'hybridTimeline': return HybridTimelineChannel;
			case 'globalTimeline': return GlobalTimelineChannel;
			case 'userList': return UserListChannel;
			case 'hashtag': return HashtagChannel;
			case 'roleTimeline': return RoleTimelineChannel;
			case 'antenna': return AntennaChannel;
			case 'channel': return ChannelChannel;
			case 'drive': return DriveChannel;
			case 'serverStats': return ServerStatsChannel;
			case 'queueStats': return QueueStatsChannel;
			case 'admin': return AdminChannel;
			case 'chatUser': return ChatUserChannel;
			case 'chatRoom': return ChatRoomChannel;
			case 'reversi': return ReversiChannel;
			case 'reversiGame': return ReversiGameChannel;

			default:
				throw new Error(`no such channel: ${name}`);
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
	private onChannelMessageRequested(data: JsonValue | undefined) {
		if (!isJsonObject(data)) return;
		if (typeof data.id !== 'string') return;
		if (typeof data.type !== 'string') return;
		if (typeof data.body === 'undefined') return;

		const channel = this.channels.find(c => c.id === data.id);
		if (channel != null && channel.onMessage != null) {
			channel.onMessage(data.type, data.body);
		}
	}

	/**
	 * ストリームが切れたとき
	 */
	@bindThis
	public dispose() {
		if (this.fetchIntervalId) clearInterval(this.fetchIntervalId);
		for (const c of this.channels.filter(c => c.dispose)) {
			if (c.dispose) c.dispose();
		}
	}
}

export interface ConnectionRequest {
	user: MiUser | null | undefined,
	token: MiAccessToken | null | undefined,
}
