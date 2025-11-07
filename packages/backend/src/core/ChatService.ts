/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { Brackets } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { QueueService } from '@/core/QueueService.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ChatEntityService } from '@/core/entities/ChatEntityService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { PushNotificationService } from '@/core/PushNotificationService.js';
import { bindThis } from '@/decorators.js';
import type { ChatApprovalsRepository, ChatMessagesRepository, ChatRoomInvitationsRepository, ChatRoomMembershipsRepository, ChatRoomsRepository, ChatSecretSettingsRepository, MiChatMessage, MiChatRoom, MiChatRoomMembership, MiDriveFile, MiUser, MutingsRepository, UsersRepository } from '@/models/_.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { QueryService } from '@/core/QueryService.js';
import { RoleService } from '@/core/RoleService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { MiChatRoomInvitation } from '@/models/ChatRoomInvitation.js';
import { Packed } from '@/misc/json-schema.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';
import { CustomEmojiService } from '@/core/CustomEmojiService.js';
import { emojiRegex } from '@/misc/emoji-regex.js';
import { NotificationService } from '@/core/NotificationService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

const MAX_ROOM_MEMBERS = 50;
const MAX_REACTIONS_PER_MESSAGE = 100;
const isCustomEmojiRegexp = /^:([\w+-]+)(?:@\.)?:$/;

// TODO: ReactionServiceのやつと共通化
function normalizeEmojiString(x: string) {
	const match = emojiRegex.exec(x);
	if (match) {
		// 合字を含む1つの絵文字
		const unicode = match[0];

		// 異体字セレクタ除去
		return unicode.match('\u200d') ? unicode : unicode.replace(/\ufe0f/g, '');
	} else {
		throw new Error('invalid emoji');
	}
}

@Injectable()
export class ChatService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.chatMessagesRepository)
		private chatMessagesRepository: ChatMessagesRepository,

		@Inject(DI.chatApprovalsRepository)
		private chatApprovalsRepository: ChatApprovalsRepository,

		@Inject(DI.chatSecretSettingsRepository)
		private chatSecretSettingsRepository: ChatSecretSettingsRepository,

		@Inject(DI.chatRoomsRepository)
		private chatRoomsRepository: ChatRoomsRepository,

		@Inject(DI.chatRoomInvitationsRepository)
		private chatRoomInvitationsRepository: ChatRoomInvitationsRepository,

		@Inject(DI.chatRoomMembershipsRepository)
		private chatRoomMembershipsRepository: ChatRoomMembershipsRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private userEntityService: UserEntityService,
		private chatEntityService: ChatEntityService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
		private apRendererService: ApRendererService,
		private queueService: QueueService,
		private pushNotificationService: PushNotificationService,
		private notificationService: NotificationService,
		private userBlockingService: UserBlockingService,
		private queryService: QueryService,
		private roleService: RoleService,
		private userFollowingService: UserFollowingService,
		private customEmojiService: CustomEmojiService,
		private moderationLogService: ModerationLogService,
	) {
	}

	@bindThis
	public async getChatAvailability(userId: MiUser['id']): Promise<{ read: boolean; write: boolean; }> {
		const policies = await this.roleService.getUserPolicies(userId);

		switch (policies.chatAvailability) {
			case 'available':
				return {
					read: true,
					write: true,
				};
			case 'readonly':
				return {
					read: true,
					write: false,
				};
			case 'unavailable':
				return {
					read: false,
					write: false,
				};
			default:
				throw new Error('invalid chat availability (unreachable)');
		}
	}

	/** getChatAvailabilityの糖衣。主にAPI呼び出し時に走らせて、権限的に問題ない場合はそのまま続行する */
	@bindThis
	public async checkChatAvailability(userId: MiUser['id'], permission: 'read' | 'write') {
		const policy = await this.getChatAvailability(userId);
		if (policy[permission] === false) {
			throw new Error('ROLE_PERMISSION_DENIED');
		}
	}

	@bindThis
	public async createMessageToUser(fromUser: { id: MiUser['id']; host: MiUser['host']; }, toUser: MiUser, params: {
		text?: string | null;
		file?: MiDriveFile | null;
		uri?: string | null;
	}): Promise<Packed<'ChatMessageLiteFor1on1'>> {
		console.log('🚀 [DEBUG] ChatService.createMessageToUser called', {
			fromUserId: fromUser.id,
			toUserId: toUser.id,
			hasText: !!params.text,
			textLength: params.text?.length,
			hasFile: !!params.file,
			timestamp: new Date().toISOString()
		});

		if (fromUser.id === toUser.id) {
			console.log('❌ [DEBUG] ChatService: User trying to send message to themselves');
			throw new Error('yourself');
		}

		console.log('🔍 [DEBUG] ChatService: Checking chat approvals...');
		const approvals = await this.chatApprovalsRepository.createQueryBuilder('approval')
			.where(new Brackets(qb => { // 自分が相手を許可しているか
				qb.where('approval.userId = :fromUserId', { fromUserId: fromUser.id })
					.andWhere('approval.otherId = :toUserId', { toUserId: toUser.id });
			}))
			.orWhere(new Brackets(qb => { // 相手が自分を許可しているか
				qb.where('approval.userId = :toUserId', { toUserId: toUser.id })
					.andWhere('approval.otherId = :fromUserId', { fromUserId: fromUser.id });
			}))
			.take(2)
			.getMany();

		const otherApprovedMe = approvals.some(approval => approval.userId === toUser.id);
		const iApprovedOther = approvals.some(approval => approval.userId === fromUser.id);

		console.log('✅ [DEBUG] ChatService: Approval check results', {
			approvalsFound: approvals.length,
			otherApprovedMe,
			iApprovedOther,
			toUserChatScope: toUser.chatScope
		});

		if (!otherApprovedMe) {
			if (toUser.chatScope === 'none') {
				throw new Error('recipient is cannot chat (none)');
			} else if (toUser.chatScope === 'followers') {
				const isFollower = await this.userFollowingService.isFollowing(fromUser.id, toUser.id);
				if (!isFollower) {
					throw new Error('recipient is cannot chat (followers)');
				}
			} else if (toUser.chatScope === 'following') {
				const isFollowing = await this.userFollowingService.isFollowing(toUser.id, fromUser.id);
				if (!isFollowing) {
					throw new Error('recipient is cannot chat (following)');
				}
			} else if (toUser.chatScope === 'mutual') {
				const isMutual = await this.userFollowingService.isMutual(fromUser.id, toUser.id);
				if (!isMutual) {
					throw new Error('recipient is cannot chat (mutual)');
				}
			}
		}

		if (!(await this.getChatAvailability(toUser.id)).write) {
			throw new Error('recipient is cannot chat (policy)');
		}

		const blocked = await this.userBlockingService.checkBlocked(toUser.id, fromUser.id);
		if (blocked) {
			throw new Error('blocked');
		}

		// 内緒の会話設定を確認
		const isSecretMessageMode = await this.getSecretModeForUsers(fromUser.id, toUser.id);
		const expiresAt = isSecretMessageMode ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null; // 24時間後

		const message = {
			id: this.idService.gen(),
			fromUserId: fromUser.id,
			toUserId: toUser.id,
			text: params.text ? params.text.trim() : null,
			fileId: params.file ? params.file.id : null,
			reads: [],
			uri: params.uri ?? null,
			expiresAt: expiresAt,
			isSystemMessage: false,
		} satisfies Partial<MiChatMessage>;

		console.log('💾 [DEBUG] ChatService: Inserting message into database...', {
			messageId: message.id,
			textLength: message.text?.length
		});

		const inserted = await this.chatMessagesRepository.insertOne(message);
		console.log('✅ [DEBUG] ChatService: Message inserted successfully');

		// 相手を許可しておく
		if (!iApprovedOther) {
			console.log('🔧 [DEBUG] ChatService: Auto-approving user for future chats');
			this.chatApprovalsRepository.insertOne({
				id: this.idService.gen(),
				userId: fromUser.id,
				otherId: toUser.id,
			});
		}

		console.log('📦 [DEBUG] ChatService: Packing message for response...');
		const packedMessage = await this.chatEntityService.packMessageLiteFor1on1(inserted);

		if (this.userEntityService.isLocalUser(toUser)) {
			const redisPipeline = this.redisClient.pipeline();
			redisPipeline.set(`newUserChatMessageExists:${toUser.id}:${fromUser.id}`, message.id);
			redisPipeline.sadd(`newChatMessagesExists:${toUser.id}`, `user:${fromUser.id}`);
			redisPipeline.exec();
		}

		if (this.userEntityService.isLocalUser(fromUser)) {
			// 自分のストリーム
			this.globalEventService.publishChatUserStream(fromUser.id, toUser.id, 'message', packedMessage);
		}

		if (this.userEntityService.isLocalUser(toUser)) {
			// 相手のストリーム
			this.globalEventService.publishChatUserStream(toUser.id, fromUser.id, 'message', packedMessage);
		}

		// 3秒経っても既読にならなかったらイベント発行
		if (this.userEntityService.isLocalUser(toUser)) {
			setTimeout(async () => {
				const marker = await this.redisClient.get(`newUserChatMessageExists:${toUser.id}:${fromUser.id}`);

				if (marker == null) return; // 既読

				const packedMessageForTo = await this.chatEntityService.packMessageDetailed(inserted, toUser);
				this.globalEventService.publishMainStream(toUser.id, 'newChatMessage', packedMessageForTo);
				this.pushNotificationService.pushNotification(toUser.id, 'newChatMessage', packedMessageForTo);
			}, 3000);
		}

		console.log('🎉 [DEBUG] ChatService: createMessageToUser completed successfully', {
			messageId: packedMessage.id,
			fromUserId: fromUser.id,
			toUserId: toUser.id
		});

		return packedMessage;
	}

	@bindThis
	public async createMessageToRoom(fromUser: { id: MiUser['id']; host: MiUser['host']; }, toRoom: MiChatRoom, params: {
		text?: string | null;
		file?: MiDriveFile | null;
		uri?: string | null;
	}): Promise<Packed<'ChatMessageLiteForRoom'>> {
		const memberships = (await this.chatRoomMembershipsRepository.findBy({ roomId: toRoom.id })).map(m => ({
			userId: m.userId,
			isMuted: m.isMuted,
		})).concat({ // ownerはmembershipレコードを作らないため
			userId: toRoom.ownerId,
			isMuted: false,
		});

		if (!memberships.some(member => member.userId === fromUser.id)) {
			throw new Error('you are not a member of the room');
		}

		const membershipsOtherThanMe = memberships.filter(member => member.userId !== fromUser.id);

		// 内緒の会話設定を確認
		const expiresAt = toRoom.isSecretMessageMode ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null; // 24時間後

		const message = {
			id: this.idService.gen(),
			fromUserId: fromUser.id,
			toRoomId: toRoom.id,
			text: params.text ? params.text.trim() : null,
			fileId: params.file ? params.file.id : null,
			reads: [],
			uri: params.uri ?? null,
			expiresAt: expiresAt,
			isSystemMessage: false,
		} satisfies Partial<MiChatMessage>;

		const inserted = await this.chatMessagesRepository.insertOne(message);

		const packedMessage = await this.chatEntityService.packMessageLiteForRoom(inserted);

		this.globalEventService.publishChatRoomStream(toRoom.id, 'message', packedMessage);

		const redisPipeline = this.redisClient.pipeline();
		for (const membership of membershipsOtherThanMe) {
			if (membership.isMuted) continue;

			redisPipeline.set(`newRoomChatMessageExists:${membership.userId}:${toRoom.id}`, message.id);
			redisPipeline.sadd(`newChatMessagesExists:${membership.userId}`, `room:${toRoom.id}`);
		}
		redisPipeline.exec();

		// 3秒経っても既読にならなかったらイベント発行
		setTimeout(async () => {
			const redisPipeline = this.redisClient.pipeline();
			for (const membership of membershipsOtherThanMe) {
				redisPipeline.get(`newRoomChatMessageExists:${membership.userId}:${toRoom.id}`);
			}
			const markers = await redisPipeline.exec();
			if (markers == null) throw new Error('redis error');

			if (markers.every(marker => marker[1] == null)) return;

			const packedMessageForTo = await this.chatEntityService.packMessageDetailed(inserted);

			for (let i = 0; i < membershipsOtherThanMe.length; i++) {
				const marker = markers[i][1];
				if (marker == null) continue;

				this.globalEventService.publishMainStream(membershipsOtherThanMe[i].userId, 'newChatMessage', packedMessageForTo);
				this.pushNotificationService.pushNotification(membershipsOtherThanMe[i].userId, 'newChatMessage', packedMessageForTo);
			}
		}, 3000);

		return packedMessage;
	}

	@bindThis
	public async readUserChatMessage(
		readerId: MiUser['id'],
		senderId: MiUser['id'],
	): Promise<void> {
		const redisPipeline = this.redisClient.pipeline();
		redisPipeline.del(`newUserChatMessageExists:${readerId}:${senderId}`);
		redisPipeline.srem(`newChatMessagesExists:${readerId}`, `user:${senderId}`);
		await redisPipeline.exec();
	}

	@bindThis
	public async readRoomChatMessage(
		readerId: MiUser['id'],
		roomId: MiChatRoom['id'],
	): Promise<void> {
		const redisPipeline = this.redisClient.pipeline();
		redisPipeline.del(`newRoomChatMessageExists:${readerId}:${roomId}`);
		redisPipeline.srem(`newChatMessagesExists:${readerId}`, `room:${roomId}`);
		await redisPipeline.exec();
	}

	@bindThis
	public async readAllChatMessages(
		readerId: MiUser['id'],
	): Promise<void> {
		const redisPipeline = this.redisClient.pipeline();
		// TODO: newUserChatMessageExists とか newRoomChatMessageExists も消したい(けどキーの列挙が必要になって面倒)
		redisPipeline.del(`newChatMessagesExists:${readerId}`);
		await redisPipeline.exec();
	}

	@bindThis
	public async readMessage(
		messageId: MiChatMessage['id'],
		readerId: MiUser['id'],
	): Promise<void> {
		// メッセージを取得
		const message = await this.chatMessagesRepository.findOne({
			where: { id: messageId },
			relations: ['toUser', 'toRoom'],
		});

		if (!message) {
			throw new Error('Message not found');
		}

		// 既読権限チェック
		if (message.toUserId) {
			// 1対1チャットの場合: 送信者と受信者のみが既読可能
			if (readerId !== message.fromUserId && readerId !== message.toUserId) {
				throw new Error('Permission denied: You cannot read this message');
			}
		} else if (message.toRoomId) {
			// ルームチャットの場合: ルームメンバーまたはオーナーのみが既読可能
			const room = message.toRoom;
			if (!room) {
				throw new Error('Room not found');
			}

			// オーナーかどうかチェック
			if (readerId === room.ownerId) {
				// オーナーなら既読可能
			} else {
				// メンバーかどうかチェック
				const membership = await this.chatRoomMembershipsRepository.findOne({
					where: { roomId: message.toRoomId, userId: readerId },
				});
				if (!membership) {
					throw new Error('Permission denied: You are not a member of this room');
				}
			}
		}

		// 既読リストに追加（重複を避ける）
		if (!message.reads.includes(readerId)) {
			await this.chatMessagesRepository.update(messageId, {
				reads: [...message.reads, readerId],
			});
		}

		// Redisキャッシュも更新
		if (message.toUserId) {
			// 1対1チャットの場合
			await this.readUserChatMessage(readerId, message.fromUserId);
		} else if (message.toRoomId) {
			// ルームチャットの場合
			await this.readRoomChatMessage(readerId, message.toRoomId);
		}

		// WebSocketで既読通知を送信
		if (message.toRoomId) {
			// ルームチャットの場合
			this.globalEventService.publishChatRoomStream(
				message.toRoomId,
				'read',
				{
					messageId: messageId,
					readerId: readerId,
				},
			);
		} else {
			// 1対1チャットの場合
			this.globalEventService.publishChatUserStream(
				message.fromUserId,
				readerId,
				'read',
				{
					messageId: messageId,
					readerId: readerId,
				},
			);
		}
	}

	@bindThis
	public findMessageById(messageId: MiChatMessage['id']) {
		return this.chatMessagesRepository.findOneBy({ id: messageId });
	}

	@bindThis
	public findMyMessageById(userId: MiUser['id'], messageId: MiChatMessage['id']) {
		return this.chatMessagesRepository.findOneBy({ id: messageId, fromUserId: userId });
	}

	@bindThis
	public async hasPermissionToViewRoomTimeline(meId: MiUser['id'], room: MiChatRoom) {
		if (await this.isRoomMember(room, meId)) {
			return true;
		} else {
			const iAmModerator = await this.roleService.isModerator({ id: meId });
			if (iAmModerator) {
				return true;
			}

			return false;
		}
	}

	@bindThis
	public async deleteMessage(message: MiChatMessage) {
		await this.chatMessagesRepository.delete(message.id);

		if (message.toUserId) {
			const [fromUser, toUser] = await Promise.all([
				this.usersRepository.findOneByOrFail({ id: message.fromUserId }),
				this.usersRepository.findOneByOrFail({ id: message.toUserId }),
			]);

			if (this.userEntityService.isLocalUser(fromUser)) this.globalEventService.publishChatUserStream(message.fromUserId, message.toUserId, 'deleted', message.id);
			if (this.userEntityService.isLocalUser(toUser)) this.globalEventService.publishChatUserStream(message.toUserId, message.fromUserId, 'deleted', message.id);

			if (this.userEntityService.isLocalUser(fromUser) && this.userEntityService.isRemoteUser(toUser)) {
				//const activity = this.apRendererService.addContext(this.apRendererService.renderDelete(this.apRendererService.renderTombstone(`${this.config.url}/notes/${message.id}`), fromUser));
				//this.queueService.deliver(fromUser, activity, toUser.inbox);
			}
		} else if (message.toRoomId) {
			this.globalEventService.publishChatRoomStream(message.toRoomId, 'deleted', message.id);
		}
	}

	@bindThis
	public async userTimeline(meId: MiUser['id'], otherId: MiUser['id'], limit: number, sinceId?: MiChatMessage['id'] | null, untilId?: MiChatMessage['id'] | null) {
		const query = this.queryService.makePaginationQuery(this.chatMessagesRepository.createQueryBuilder('message'), sinceId, untilId)
			.andWhere(new Brackets(qb => {
				qb
					.where(new Brackets(qb => {
						qb
							.where('message.fromUserId = :meId')
							.andWhere('message.toUserId = :otherId');
					}))
					.orWhere(new Brackets(qb => {
						qb
							.where('message.fromUserId = :otherId')
							.andWhere('message.toUserId = :meId');
					}));
			}))
			.setParameter('meId', meId)
			.setParameter('otherId', otherId);

		const messages = await query.take(limit).getMany();

		return messages;
	}

	@bindThis
	public async roomTimeline(roomId: MiChatRoom['id'], limit: number, sinceId?: MiChatMessage['id'] | null, untilId?: MiChatMessage['id'] | null) {
		const query = this.queryService.makePaginationQuery(this.chatMessagesRepository.createQueryBuilder('message'), sinceId, untilId)
			.andWhere('message.toRoomId = :roomId', { roomId })
			.leftJoinAndSelect('message.file', 'file')
			.leftJoinAndSelect('message.fromUser', 'fromUser');

		const messages = await query.take(limit).getMany();

		return messages;
	}

	@bindThis
	public async userHistory(meId: MiUser['id'], limit: number): Promise<MiChatMessage[]> {
		const history: MiChatMessage[] = [];

		const mutingQuery = this.mutingsRepository.createQueryBuilder('muting')
			.select('muting.muteeId')
			.where('muting.muterId = :muterId', { muterId: meId });

		for (let i = 0; i < limit; i++) {
			const found = history.map(m => (m.fromUserId === meId) ? m.toUserId! : m.fromUserId!);

			const query = this.chatMessagesRepository.createQueryBuilder('message')
				.orderBy('message.id', 'DESC')
				.where(new Brackets(qb => {
					qb
						.where('message.fromUserId = :meId', { meId: meId })
						.orWhere('message.toUserId = :meId', { meId: meId });
				}))
				.andWhere('message.toRoomId IS NULL')
				.andWhere(`message.fromUserId NOT IN (${ mutingQuery.getQuery() })`)
				.andWhere(`message.toUserId NOT IN (${ mutingQuery.getQuery() })`);

			if (found.length > 0) {
				query.andWhere('message.fromUserId NOT IN (:...found)', { found: found });
				query.andWhere('message.toUserId NOT IN (:...found)', { found: found });
			}

			query.setParameters(mutingQuery.getParameters());

			const message = await query.getOne();

			if (message) {
				history.push(message);
			} else {
				break;
			}
		}

		return history;
	}

	@bindThis
	public async roomHistory(meId: MiUser['id'], limit: number): Promise<MiChatMessage[]> {
		// TODO: 一回のクエリにまとめられるかも
		const [memberRoomIds, ownedRoomIds] = await Promise.all([
			this.chatRoomMembershipsRepository.findBy({
				userId: meId,
			}).then(xs => xs.map(x => x.roomId)),
			this.chatRoomsRepository.findBy({
				ownerId: meId,
			}).then(xs => xs.map(x => x.id)),
		]);

		const roomIds = memberRoomIds.concat(ownedRoomIds);

		if (memberRoomIds.length === 0 && ownedRoomIds.length === 0) {
			return [];
		}

		const history: MiChatMessage[] = [];

		for (let i = 0; i < limit; i++) {
			const found = history.map(m => m.toRoomId!);

			const query = this.chatMessagesRepository.createQueryBuilder('message')
				.orderBy('message.id', 'DESC')
				.where('message.toRoomId IN (:...roomIds)', { roomIds });

			if (found.length > 0) {
				query.andWhere('message.toRoomId NOT IN (:...found)', { found: found });
			}

			const message = await query.getOne();

			if (message) {
				history.push(message);
			} else {
				break;
			}
		}

		return history;
	}

	@bindThis
	public async getUserReadStateMap(userId: MiUser['id'], otherIds: MiUser['id'][]) {
		const readStateMap: Record<MiUser['id'], boolean> = {};

		const redisPipeline = this.redisClient.pipeline();

		for (const otherId of otherIds) {
			redisPipeline.get(`newUserChatMessageExists:${userId}:${otherId}`);
		}

		const markers = await redisPipeline.exec();
		if (markers == null) throw new Error('redis error');

		for (let i = 0; i < otherIds.length; i++) {
			const marker = markers[i][1];
			readStateMap[otherIds[i]] = marker == null;
		}

		return readStateMap;
	}

	@bindThis
	public async getRoomReadStateMap(userId: MiUser['id'], roomIds: MiChatRoom['id'][]) {
		const readStateMap: Record<MiChatRoom['id'], boolean> = {};

		const redisPipeline = this.redisClient.pipeline();

		for (const roomId of roomIds) {
			redisPipeline.get(`newRoomChatMessageExists:${userId}:${roomId}`);
		}

		const markers = await redisPipeline.exec();
		if (markers == null) throw new Error('redis error');

		for (let i = 0; i < roomIds.length; i++) {
			const marker = markers[i][1];
			readStateMap[roomIds[i]] = marker == null;
		}

		return readStateMap;
	}

	@bindThis
	public async hasUnreadMessages(userId: MiUser['id']) {
		const card = await this.redisClient.scard(`newChatMessagesExists:${userId}`);
		return card > 0;
	}

	@bindThis
	public async createRoom(owner: MiUser, params: Partial<{
		name: string;
		description: string;
	}>) {
		const room = {
			id: this.idService.gen(),
			name: params.name,
			description: params.description,
			ownerId: owner.id,
		} satisfies Partial<MiChatRoom>;

		const created = await this.chatRoomsRepository.insertOne(room);

		return created;
	}

	@bindThis
	public async hasPermissionToDeleteRoom(meId: MiUser['id'], room: MiChatRoom) {
		if (room.ownerId === meId) {
			return true;
		}

		const iAmModerator = await this.roleService.isModerator({ id: meId });
		if (iAmModerator) {
			return true;
		}

		return false;
	}

	@bindThis
	public async deleteRoom(room: MiChatRoom, deleter?: MiUser) {
		const memberships = (await this.chatRoomMembershipsRepository.findBy({ roomId: room.id })).map(m => ({
			userId: m.userId,
		})).concat({ // ownerはmembershipレコードを作らないため
			userId: room.ownerId,
		});

		// 未読フラグ削除
		const redisPipeline = this.redisClient.pipeline();
		for (const membership of memberships) {
			redisPipeline.del(`newRoomChatMessageExists:${membership.userId}:${room.id}`);
			redisPipeline.srem(`newChatMessagesExists:${membership.userId}`, `room:${room.id}`);
		}
		await redisPipeline.exec();

		await this.chatRoomsRepository.delete(room.id);

		if (deleter) {
			const deleterIsModerator = await this.roleService.isModerator(deleter);

			if (deleterIsModerator) {
				this.moderationLogService.log(deleter, 'deleteChatRoom', {
					roomId: room.id,
					room: room,
				});
			}
		}
	}

	@bindThis
	public async findMyRoomById(ownerId: MiUser['id'], roomId: MiChatRoom['id']) {
		return this.chatRoomsRepository.findOneBy({ id: roomId, ownerId: ownerId });
	}

	@bindThis
	public async findRoomById(roomId: MiChatRoom['id']) {
		return this.chatRoomsRepository.findOne({ where: { id: roomId }, relations: ['owner'] });
	}

	@bindThis
	public async isRoomMember(room: MiChatRoom, userId: MiUser['id']) {
		if (room.ownerId === userId) return true;
		const membership = await this.chatRoomMembershipsRepository.findOneBy({ roomId: room.id, userId });
		return membership != null;
	}

	@bindThis
	public async checkMembership(roomId: MiChatRoom['id'], userId: MiUser['id']) {
		return this.chatRoomMembershipsRepository.findOneBy({ roomId, userId });
	}

	@bindThis
	public async createRoomInvitation(inviterId: MiUser['id'], roomId: MiChatRoom['id'], inviteeId: MiUser['id']) {
		if (inviterId === inviteeId) {
			throw new Error('yourself');
		}

		const room = await this.chatRoomsRepository.findOneByOrFail({ id: roomId, ownerId: inviterId });

		if (await this.isRoomMember(room, inviteeId)) {
			throw new Error('already member');
		}

		const existingInvitation = await this.chatRoomInvitationsRepository.findOneBy({ roomId, userId: inviteeId });
		if (existingInvitation) {
			throw new Error('already invited');
		}

		const membershipsCount = await this.chatRoomMembershipsRepository.countBy({ roomId });
		if (membershipsCount >= MAX_ROOM_MEMBERS) {
			throw new Error('room is full');
		}

		// TODO: cehck block

		const invitation = {
			id: this.idService.gen(),
			roomId: room.id,
			userId: inviteeId,
		} satisfies Partial<MiChatRoomInvitation>;

		const created = await this.chatRoomInvitationsRepository.insertOne(invitation);

		this.notificationService.createNotification(inviteeId, 'chatRoomInvitationReceived', {
			invitationId: invitation.id,
		}, inviterId);

		return created;
	}

	@bindThis
	public async getSentRoomInvitationsWithPagination(roomId: MiChatRoom['id'], limit: number, sinceId?: MiChatRoomInvitation['id'] | null, untilId?: MiChatRoomInvitation['id'] | null) {
		const query = this.queryService.makePaginationQuery(this.chatRoomInvitationsRepository.createQueryBuilder('invitation'), sinceId, untilId)
			.andWhere('invitation.roomId = :roomId', { roomId });

		const invitations = await query.take(limit).getMany();

		return invitations;
	}

	@bindThis
	public async getOwnedRoomsWithPagination(ownerId: MiUser['id'], limit: number, sinceId?: MiChatRoom['id'] | null, untilId?: MiChatRoom['id'] | null) {
		const query = this.queryService.makePaginationQuery(this.chatRoomsRepository.createQueryBuilder('room'), sinceId, untilId)
			.andWhere('room.ownerId = :ownerId', { ownerId });

		const rooms = await query.take(limit).getMany();

		return rooms;
	}

	@bindThis
	public async getReceivedRoomInvitationsWithPagination(userId: MiUser['id'], limit: number, sinceId?: MiChatRoomInvitation['id'] | null, untilId?: MiChatRoomInvitation['id'] | null) {
		const query = this.queryService.makePaginationQuery(this.chatRoomInvitationsRepository.createQueryBuilder('invitation'), sinceId, untilId)
			.andWhere('invitation.userId = :userId', { userId })
			.andWhere('invitation.ignored = FALSE');

		const invitations = await query.take(limit).getMany();

		return invitations;
	}

	@bindThis
	public async joinToRoom(userId: MiUser['id'], roomId: MiChatRoom['id']) {
		const invitation = await this.chatRoomInvitationsRepository.findOneByOrFail({ roomId, userId });

		const membershipsCount = await this.chatRoomMembershipsRepository.countBy({ roomId });
		if (membershipsCount >= MAX_ROOM_MEMBERS) {
			throw new Error('room is full');
		}

		const membership = {
			id: this.idService.gen(),
			roomId: roomId,
			userId: userId,
		} satisfies Partial<MiChatRoomMembership>;

		// TODO: transaction
		await this.chatRoomMembershipsRepository.insertOne(membership);
		await this.chatRoomInvitationsRepository.delete(invitation.id);

		// Publish room join event to all room members
		this.globalEventService.publishChatRoomStream(roomId, 'joined', {
			userId: userId,
			membershipId: membership.id,
		});

		// Publish main stream event to the user who joined
		this.globalEventService.publishMainStream(userId, 'chatRoomJoined', {
			roomId: roomId,
			membershipId: membership.id,
		});
	}

	@bindThis
	public async ignoreRoomInvitation(userId: MiUser['id'], roomId: MiChatRoom['id']) {
		const invitation = await this.chatRoomInvitationsRepository.findOneByOrFail({ roomId, userId });
		await this.chatRoomInvitationsRepository.update(invitation.id, { ignored: true });
	}

	@bindThis
	public async leaveRoom(userId: MiUser['id'], roomId: MiChatRoom['id']) {
		const membership = await this.chatRoomMembershipsRepository.findOneByOrFail({ roomId, userId });
		await this.chatRoomMembershipsRepository.delete(membership.id);

		// 未読フラグを消す (「既読にする」というわけでもないのでreadメソッドは使わないでおく)
		const redisPipeline = this.redisClient.pipeline();
		redisPipeline.del(`newRoomChatMessageExists:${userId}:${roomId}`);
		redisPipeline.srem(`newChatMessagesExists:${userId}`, `room:${roomId}`);
		await redisPipeline.exec();
	}

	@bindThis
	public async muteRoom(userId: MiUser['id'], roomId: MiChatRoom['id'], mute: boolean) {
		const membership = await this.chatRoomMembershipsRepository.findOneByOrFail({ roomId, userId });
		await this.chatRoomMembershipsRepository.update(membership.id, { isMuted: mute });
	}

	@bindThis
	public async updateRoom(room: MiChatRoom, params: {
		name?: string;
		description?: string;
	}): Promise<MiChatRoom> {
		return this.chatRoomsRepository.createQueryBuilder().update()
			.set(params)
			.where('id = :id', { id: room.id })
			.returning('*')
			.execute()
			.then((response) => {
				return response.raw[0];
			});
	}

	@bindThis
	public async getRoomMembershipsWithPagination(roomId: MiChatRoom['id'], limit: number, sinceId?: MiChatRoomMembership['id'] | null, untilId?: MiChatRoomMembership['id'] | null) {
		const query = this.queryService.makePaginationQuery(this.chatRoomMembershipsRepository.createQueryBuilder('membership'), sinceId, untilId)
			.andWhere('membership.roomId = :roomId', { roomId });

		const memberships = await query.take(limit).getMany();

		return memberships;
	}

	@bindThis
	public async searchMessages(meId: MiUser['id'], query: string, limit: number, params: {
		userId?: MiUser['id'] | null;
		roomId?: MiChatRoom['id'] | null;
	}) {
		const q = this.chatMessagesRepository.createQueryBuilder('message');

		if (params.userId) {
			q.andWhere(new Brackets(qb => {
				qb
					.where(new Brackets(qb => {
						qb
							.where('message.fromUserId = :meId')
							.andWhere('message.toUserId = :otherId');
					}))
					.orWhere(new Brackets(qb => {
						qb
							.where('message.fromUserId = :otherId')
							.andWhere('message.toUserId = :meId');
					}));
			}))
				.setParameter('meId', meId)
				.setParameter('otherId', params.userId);
		} else if (params.roomId) {
			q.where('message.toRoomId = :roomId', { roomId: params.roomId });
		} else {
			const membershipsQuery = this.chatRoomMembershipsRepository.createQueryBuilder('membership')
				.select('membership.roomId')
				.where('membership.userId = :meId', { meId: meId });

			const ownedRoomsQuery = this.chatRoomsRepository.createQueryBuilder('room')
				.select('room.id')
				.where('room.ownerId = :meId', { meId });

			q.andWhere(new Brackets(qb => {
				qb
					.where('message.fromUserId = :meId')
					.orWhere('message.toUserId = :meId')
					.orWhere(`message.toRoomId IN (${membershipsQuery.getQuery()})`)
					.orWhere(`message.toRoomId IN (${ownedRoomsQuery.getQuery()})`);
			}));

			q.setParameters(membershipsQuery.getParameters());
			q.setParameters(ownedRoomsQuery.getParameters());
		}

		q.andWhere('LOWER(message.text) LIKE :q', { q: `%${ sqlLikeEscape(query.toLowerCase()) }%` });

		q.leftJoinAndSelect('message.file', 'file');
		q.leftJoinAndSelect('message.fromUser', 'fromUser');
		q.leftJoinAndSelect('message.toUser', 'toUser');
		q.leftJoinAndSelect('message.toRoom', 'toRoom');
		q.leftJoinAndSelect('toRoom.owner', 'toRoomOwner');

		const messages = await q.orderBy('message.id', 'DESC').take(limit).getMany();

		return messages;
	}

	@bindThis
	public async react(messageId: MiChatMessage['id'], userId: MiUser['id'], reaction_: string) {
		let reaction;

		const custom = reaction_.match(isCustomEmojiRegexp);

		if (custom == null) {
			reaction = normalizeEmojiString(reaction_);
		} else {
			const name = custom[1];
			const emoji = (await this.customEmojiService.localEmojisCache.fetch()).get(name);

			if (emoji == null) {
				throw new Error('no such emoji');
			} else {
				reaction = `:${name}:`;
			}
		}

		const message = await this.chatMessagesRepository.findOneByOrFail({ id: messageId });

		if (message.fromUserId === userId) {
			throw new Error('cannot react to own message');
		}

		if (message.toRoomId === null && message.toUserId !== userId) {
			throw new Error('cannot react to others message');
		}

		if (message.reactions.length >= MAX_REACTIONS_PER_MESSAGE) {
			throw new Error('too many reactions');
		}

		const room = message.toRoomId ? await this.chatRoomsRepository.findOneByOrFail({ id: message.toRoomId }) : null;

		if (room) {
			if (!await this.isRoomMember(room, userId)) {
				throw new Error('cannot react to others message');
			}
		}

		await this.chatMessagesRepository.createQueryBuilder().update()
			.set({
				reactions: () => `array_append("reactions", '${userId}/${reaction}')`,
			})
			.where('id = :id', { id: message.id })
			.execute();

		if (room) {
			this.globalEventService.publishChatRoomStream(room.id, 'react', {
				messageId: message.id,
				user: await this.userEntityService.pack(userId),
				reaction,
			});
		} else {
			this.globalEventService.publishChatUserStream(message.fromUserId, message.toUserId!, 'react', {
				messageId: message.id,
				reaction,
			});
			this.globalEventService.publishChatUserStream(message.toUserId!, message.fromUserId, 'react', {
				messageId: message.id,
				reaction,
			});
		}
	}

	@bindThis
	public async unreact(messageId: MiChatMessage['id'], userId: MiUser['id'], reaction_: string) {
		let reaction;

		const custom = reaction_.match(isCustomEmojiRegexp);

		if (custom == null) {
			reaction = normalizeEmojiString(reaction_);
		} else { // 削除されたカスタム絵文字のリアクションを削除したいかもしれないので絵文字の存在チェックはする必要なし
			const name = custom[1];
			reaction = `:${name}:`;
		}

		// NOTE: 自分のリアクションを(あれば)削除するだけなので諸々の権限チェックは必要なし

		const message = await this.chatMessagesRepository.findOneByOrFail({ id: messageId });

		const room = message.toRoomId ? await this.chatRoomsRepository.findOneByOrFail({ id: message.toRoomId }) : null;

		await this.chatMessagesRepository.createQueryBuilder().update()
			.set({
				reactions: () => `array_remove("reactions", '${userId}/${reaction}')`,
			})
			.where('id = :id', { id: message.id })
			.execute();

		// TODO: 実際に削除が行われたときのみイベントを発行する

		if (room) {
			this.globalEventService.publishChatRoomStream(room.id, 'unreact', {
				messageId: message.id,
				user: await this.userEntityService.pack(userId),
				reaction,
			});
		} else {
			this.globalEventService.publishChatUserStream(message.fromUserId, message.toUserId!, 'unreact', {
				messageId: message.id,
				reaction,
			});
			this.globalEventService.publishChatUserStream(message.toUserId!, message.fromUserId, 'unreact', {
				messageId: message.id,
				reaction,
			});
		}
	}

	@bindThis
	public async getMyMemberships(userId: MiUser['id'], limit: number, sinceId?: MiChatRoomMembership['id'] | null, untilId?: MiChatRoomMembership['id'] | null) {
		const query = this.queryService.makePaginationQuery(this.chatRoomMembershipsRepository.createQueryBuilder('membership'), sinceId, untilId)
			.andWhere('membership.userId = :userId', { userId });

		const memberships = await query.take(limit).getMany();

		return memberships;
	}

	@bindThis
	public async getSecretModeForUsers(userId1: MiUser['id'], userId2: MiUser['id']): Promise<boolean> {
		// ユーザーIDの順序を統一（小さいIDを先に）
		const [user1Id, user2Id] = [userId1, userId2].sort();

		// 既存の設定を検索
		const secretSetting = await this.chatSecretSettingsRepository.findOneBy({
			user1Id: user1Id,
			user2Id: user2Id,
		});

		return secretSetting?.isSecretMessageMode ?? false;
	}

	@bindThis
	public async setSecretModeForUsers(userId1: MiUser['id'], userId2: MiUser['id'], isSecretMessageMode: boolean, updatedBy: MiUser['id']): Promise<void> {
		// ユーザーIDの順序を統一（小さいIDを先に）
		const [user1Id, user2Id] = [userId1, userId2].sort();

		// 既存の設定を検索
		let secretSetting = await this.chatSecretSettingsRepository.findOneBy({
			user1Id: user1Id,
			user2Id: user2Id,
		});

		if (secretSetting) {
			// 既存の設定を更新
			secretSetting.isSecretMessageMode = isSecretMessageMode;
			await this.chatSecretSettingsRepository.save(secretSetting);
		} else if (isSecretMessageMode) {
			// 新しい設定を作成（秘密モードをONにする場合のみ）
			secretSetting = this.chatSecretSettingsRepository.create({
				id: this.idService.gen(),
				user1Id: user1Id,
				user2Id: user2Id,
				isSecretMessageMode: isSecretMessageMode,
			});
			await this.chatSecretSettingsRepository.save(secretSetting);
		}

		// システムメッセージを送信
		const systemMessageText = isSecretMessageMode ? '内緒の会話がオンになりました' : '内緒の会話がオフになりました';

		const systemMessage = {
			id: this.idService.gen(),
			fromUserId: updatedBy,
			toUserId: userId1 === updatedBy ? userId2 : userId1,
			text: systemMessageText,
			isSystemMessage: true,
			meta: {
				type: 'secretModeChange',
				isSecretMessageMode: isSecretMessageMode,
			} as Record<string, any>,
			reads: [],
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // システムメッセージも24時間後に削除
		} satisfies Partial<MiChatMessage>;

		const inserted = await this.chatMessagesRepository.insertOne(systemMessage);

		// リアルタイム更新
		if (inserted.toUserId) {
			const packedMessage = await this.chatEntityService.packMessageLiteFor1on1(inserted);
			this.globalEventService.publishChatUserStream(inserted.fromUserId, inserted.toUserId, 'message', packedMessage);
			this.globalEventService.publishChatUserStream(inserted.toUserId, inserted.fromUserId, 'message', packedMessage);
		}
	}

	@bindThis
	public async setSecretModeForRoom(roomId: MiChatRoom['id'], isSecretMessageMode: boolean, updatedBy: MiUser['id']): Promise<void> {
		await this.chatRoomsRepository.update(roomId, {
			isSecretMessageMode: isSecretMessageMode,
		});

		// システムメッセージを送信
		const systemMessageText = isSecretMessageMode ? '内緒の会話がオンになりました' : '内緒の会話がオフになりました';

		const systemMessage = {
			id: this.idService.gen(),
			fromUserId: updatedBy,
			toRoomId: roomId,
			text: systemMessageText,
			isSystemMessage: true,
			meta: {
				type: 'secretModeChange',
				isSecretMessageMode: isSecretMessageMode,
			} as Record<string, any>,
			reads: [],
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // システムメッセージも24時間後に削除
		} satisfies Partial<MiChatMessage>;

		const inserted = await this.chatMessagesRepository.insertOne(systemMessage);

		// リアルタイム更新
		const packedMessage = await this.chatEntityService.packMessageLiteForRoom(inserted);
		this.globalEventService.publishChatRoomStream(roomId, 'message', packedMessage);
	}

	@bindThis
	public async notifyUserTyping(fromUserId: MiUser['id'], toUserId: MiUser['id']): Promise<void> {
		console.log(`🔍 [DEBUG] ChatService.notifyUserTyping called: ${fromUserId} -> ${toUserId}`);

		// セキュリティ: 送信者ユーザーの存在・有効性確認
		const fromUser = await this.usersRepository.findOneBy({ id: fromUserId });
		if (!fromUser) {
			console.warn(`🔍 [SECURITY] Typing event from non-existent user: ${fromUserId}`);
			return;
		}

		if (fromUser.isSuspended || fromUser.isDeleted) {
			console.warn(`🔍 [SECURITY] Typing event from suspended/deleted user: ${fromUserId}`);
			return;
		}

		const packedUser = await this.userEntityService.pack(fromUser, null, { schema: 'UserLite' });
		console.log(`🔍 [DEBUG] Publishing chatUserStream typing event for ${fromUser.username}`);

		// セキュリティ: 送信するユーザーIDは検証済みのfromUserIdを強制使用
		this.globalEventService.publishChatUserStream(fromUserId, toUserId, 'typing', {
			userId: fromUserId,
			user: packedUser,
		});
	}

	@bindThis
	public async notifyRoomTyping(fromUserId: MiUser['id'], roomId: MiChatRoom['id']): Promise<void> {
		console.log(`🔍 [DEBUG] ChatService.notifyRoomTyping called: ${fromUserId} in room ${roomId}`);

		// セキュリティ: 送信者ユーザーの存在・有効性確認
		const fromUser = await this.usersRepository.findOneBy({ id: fromUserId });
		if (!fromUser) {
			console.warn(`🔍 [SECURITY] Typing event from non-existent user: ${fromUserId}`);
			return;
		}

		if (fromUser.isSuspended || fromUser.isDeleted) {
			console.warn(`🔍 [SECURITY] Typing event from suspended/deleted user: ${fromUserId}`);
			return;
		}

		// セキュリティ: ルームメンバーシップ確認
		const room = await this.chatRoomsRepository.findOneBy({ id: roomId });
		if (!room) {
			console.warn(`🔍 [SECURITY] Typing event for non-existent room: ${roomId}`);
			return;
		}

		if (!await this.isRoomMember(room, fromUserId)) {
			console.warn(`🔍 [SECURITY] Typing event from non-member user ${fromUserId} for room ${roomId}`);
			return;
		}

		const packedUser = await this.userEntityService.pack(fromUser, null, { schema: 'UserLite' });
		console.log(`🔍 [DEBUG] Publishing chatRoomStream typing event for ${fromUser.username}`);

		// セキュリティ: 送信するユーザーIDは検証済みのfromUserIdを強制使用
		this.globalEventService.publishChatRoomStream(roomId, 'typing', {
			userId: fromUserId,
			user: packedUser,
		});
	}

	@bindThis
	public async notifyUserTypingStop(fromUserId: MiUser['id'], toUserId: MiUser['id']): Promise<void> {
		console.log(`🔍 [DEBUG] ChatService.notifyUserTypingStop called: ${fromUserId} -> ${toUserId}`);

		// セキュリティ: 送信者ユーザーの存在確認（軽量チェック）
		const fromUser = await this.usersRepository.findOneBy({ id: fromUserId });
		if (!fromUser) {
			console.warn(`🔍 [SECURITY] TypingStop event from non-existent user: ${fromUserId}`);
			return;
		}

		// セキュリティ: 送信するユーザーIDは検証済みのfromUserIdを強制使用
		this.globalEventService.publishChatUserStream(fromUserId, toUserId, 'typingStop', {
			userId: fromUserId,
		});
	}

	@bindThis
	public async notifyRoomTypingStop(fromUserId: MiUser['id'], roomId: MiChatRoom['id']): Promise<void> {
		console.log(`🔍 [DEBUG] ChatService.notifyRoomTypingStop called: ${fromUserId} in room ${roomId}`);

		// セキュリティ: 送信者ユーザーの存在確認（軽量チェック）
		const fromUser = await this.usersRepository.findOneBy({ id: fromUserId });
		if (!fromUser) {
			console.warn(`🔍 [SECURITY] TypingStop event from non-existent user: ${fromUserId}`);
			return;
		}

		// セキュリティ: ルームメンバーシップ確認
		const room = await this.chatRoomsRepository.findOneBy({ id: roomId });
		if (!room) {
			console.warn(`🔍 [SECURITY] TypingStop event for non-existent room: ${roomId}`);
			return;
		}

		if (!await this.isRoomMember(room, fromUserId)) {
			console.warn(`🔍 [SECURITY] TypingStop event from non-member user ${fromUserId} for room ${roomId}`);
			return;
		}

		// セキュリティ: 送信するユーザーIDは検証済みのfromUserIdを強制使用
		this.globalEventService.publishChatRoomStream(roomId, 'typingStop', {
			userId: fromUserId,
		});
	}

	@bindThis
	public async broadcastCursorMove(roomId: MiChatRoom['id'], fromUserId: MiUser['id'], cursorData: any): Promise<void> {
		const room = await this.chatRoomsRepository.findOneBy({ id: roomId });
		if (!room) {
			console.warn(`🔍 [SECURITY] CursorMove event for non-existent room ${roomId}`);
			return;
		}

		if (!await this.isRoomMember(room, fromUserId)) {
			console.warn(`🔍 [SECURITY] CursorMove event from non-member user ${fromUserId} for room ${roomId}`);
			return;
		}

		this.globalEventService.publishChatRoomStream(roomId, 'cursorMove', {
			userId: fromUserId,
			userName: cursorData.userName,
			x: cursorData.x,
			y: cursorData.y,
			timestamp: cursorData.timestamp,
		});
	}

	@bindThis
	public async broadcastDrawingStroke(roomId: MiChatRoom['id'], fromUserId: MiUser['id'], strokeData: any): Promise<void> {
		const room = await this.chatRoomsRepository.findOneBy({ id: roomId });
		if (!room) {
			console.warn(`🔍 [SECURITY] DrawingStroke event for non-existent room ${roomId}`);
			return;
		}

		if (!await this.isRoomMember(room, fromUserId)) {
			console.warn(`🔍 [SECURITY] DrawingStroke event from non-member user ${fromUserId} for room ${roomId}`);
			return;
		}

		this.globalEventService.publishChatRoomStream(roomId, 'drawingStroke', strokeData);
	}

	@bindThis
	public async broadcastDrawingProgress(roomId: MiChatRoom['id'], fromUserId: MiUser['id'], progressData: any): Promise<void> {
		const room = await this.chatRoomsRepository.findOneBy({ id: roomId });
		if (!room) return; // 無言で制限（高頻度イベントのため）

		if (!await this.isRoomMember(room, fromUserId)) return; // 無言で制限

		this.globalEventService.publishChatRoomStream(roomId, 'drawingProgress', progressData);
	}

	@bindThis
	public async broadcastClearCanvas(roomId: MiChatRoom['id'], fromUserId: MiUser['id'], clearData: any): Promise<void> {
		const room = await this.chatRoomsRepository.findOneBy({ id: roomId });
		if (!room) {
			console.warn(`🔍 [SECURITY] ClearCanvas event for non-existent room ${roomId}`);
			return;
		}

		if (!await this.isRoomMember(room, fromUserId)) {
			console.warn(`🔍 [SECURITY] ClearCanvas event from non-member user ${fromUserId} for room ${roomId}`);
			return;
		}

		this.globalEventService.publishChatRoomStream(roomId, 'clearCanvas', clearData);
	}

	@bindThis
	/**
	 * Undo Stroke配信
	 *
	 * 【仕様】
	 * - 指定されたルームにUndoイベントを配信
	 * - ルームメンバーのみが配信可能
	 * - レイヤー情報とストロークIDを含む
	 */
	public async broadcastUndoStroke(roomId: MiChatRoom['id'], fromUserId: MiUser['id'], undoData: any): Promise<void> {
		const room = await this.chatRoomsRepository.findOneBy({ id: roomId });
		if (!room) {
			console.warn(`🔍 [SECURITY] UndoStroke event for non-existent room ${roomId}`);
			return;
		}

		if (!await this.isRoomMember(room, fromUserId)) {
			console.warn(`🔍 [SECURITY] UndoStroke event from non-member user ${fromUserId} for room ${roomId}`);
			return;
		}

		this.globalEventService.publishChatRoomStream(roomId, 'undoStroke', undoData);
	}

	/**
	 * Redo Stroke配信
	 *
	 * 【仕様】
	 * - 指定されたルームにRedoイベントを配信
	 * - ルームメンバーのみが配信可能
	 * - レイヤー情報と復元するストロークデータを含む
	 */
	public async broadcastRedoStroke(roomId: MiChatRoom['id'], fromUserId: MiUser['id'], redoData: any): Promise<void> {
		const room = await this.chatRoomsRepository.findOneBy({ id: roomId });
		if (!room) {
			console.warn(`🔍 [SECURITY] RedoStroke event for non-existent room ${roomId}`);
			return;
		}

		if (!await this.isRoomMember(room, fromUserId)) {
			console.warn(`🔍 [SECURITY] RedoStroke event from non-member user ${fromUserId} for room ${roomId}`);
			return;
		}

		this.globalEventService.publishChatRoomStream(roomId, 'redoStroke', redoData);
	}

	/**
	 * Canvas Size Change配信
	 *
	 * 【仕様】
	 * - 指定されたルームにキャンバスサイズ変更イベントを配信
	 * - ルームメンバーのみが配信可能
	 * - 新しいキャンバスサイズ情報を含む
	 */
	public async broadcastCanvasSizeChange(roomId: MiChatRoom['id'], fromUserId: MiUser['id'], sizeData: any): Promise<void> {
		const room = await this.chatRoomsRepository.findOneBy({ id: roomId });
		if (!room) {
			console.warn(`🔍 [SECURITY] CanvasSizeChange event for non-existent room ${roomId}`);
			return;
		}

		if (!await this.isRoomMember(room, fromUserId)) {
			console.warn(`🔍 [SECURITY] CanvasSizeChange event from non-member user ${fromUserId} for room ${roomId}`);
			return;
		}

		this.globalEventService.publishChatRoomStream(roomId, 'canvasSizeChange', sizeData);
	}

	// =====================================================
	// ユーザー間チャット用のお絵かきイベント配信メソッド
	// =====================================================

	/**
	 * ユーザー間チャット用: Drawing Stroke配信
	 */
	@bindThis
	public async broadcastUserDrawingStroke(userId1: MiUser['id'], userId2: MiUser['id'], fromUserId: MiUser['id'], strokeData: any): Promise<void> {
		// ユーザー存在確認
		const user1 = await this.usersRepository.findOneBy({ id: userId1 });
		const user2 = await this.usersRepository.findOneBy({ id: userId2 });
		if (!user1 || !user2) {
			console.warn(`🔍 [SECURITY] DrawingStroke event for non-existent user`);
			return;
		}

		// 送信者が参加者の一人であることを確認
		if (fromUserId !== userId1 && fromUserId !== userId2) {
			console.warn(`🔍 [SECURITY] DrawingStroke event from non-participant user ${fromUserId}`);
			return;
		}

		// ソート済みIDでストリーム識別子を生成
		const sortedIds = [userId1, userId2].sort();
		this.globalEventService.publishChatUserStream(sortedIds[0], sortedIds[1], 'drawingStroke', strokeData);
	}

	/**
	 * ユーザー間チャット用: Drawing Progress配信
	 */
	@bindThis
	public async broadcastUserDrawingProgress(userId1: MiUser['id'], userId2: MiUser['id'], fromUserId: MiUser['id'], progressData: any): Promise<void> {
		// 高頻度イベントのため簡易チェック
		if (fromUserId !== userId1 && fromUserId !== userId2) return;

		const sortedIds = [userId1, userId2].sort();
		this.globalEventService.publishChatUserStream(sortedIds[0], sortedIds[1], 'drawingProgress', progressData);
	}

	/**
	 * ユーザー間チャット用: Cursor Move配信
	 */
	@bindThis
	public async broadcastUserCursorMove(userId1: MiUser['id'], userId2: MiUser['id'], fromUserId: MiUser['id'], cursorData: any): Promise<void> {
		// 高頻度イベントのため簡易チェック
		if (fromUserId !== userId1 && fromUserId !== userId2) return;

		const sortedIds = [userId1, userId2].sort();
		this.globalEventService.publishChatUserStream(sortedIds[0], sortedIds[1], 'cursorMove', {
			userId: fromUserId,
			userName: cursorData.userName,
			x: cursorData.x,
			y: cursorData.y,
			timestamp: cursorData.timestamp,
		});
	}

	/**
	 * ユーザー間チャット用: Clear Canvas配信
	 */
	@bindThis
	public async broadcastUserClearCanvas(userId1: MiUser['id'], userId2: MiUser['id'], fromUserId: MiUser['id'], clearData: any): Promise<void> {
		const user1 = await this.usersRepository.findOneBy({ id: userId1 });
		const user2 = await this.usersRepository.findOneBy({ id: userId2 });
		if (!user1 || !user2) {
			console.warn(`🔍 [SECURITY] ClearCanvas event for non-existent user`);
			return;
		}

		if (fromUserId !== userId1 && fromUserId !== userId2) {
			console.warn(`🔍 [SECURITY] ClearCanvas event from non-participant user ${fromUserId}`);
			return;
		}

		const sortedIds = [userId1, userId2].sort();
		this.globalEventService.publishChatUserStream(sortedIds[0], sortedIds[1], 'clearCanvas', clearData);
	}

	/**
	 * ユーザー間チャット用: Undo Stroke配信
	 */
	@bindThis
	public async broadcastUserUndoStroke(userId1: MiUser['id'], userId2: MiUser['id'], fromUserId: MiUser['id'], undoData: any): Promise<void> {
		const user1 = await this.usersRepository.findOneBy({ id: userId1 });
		const user2 = await this.usersRepository.findOneBy({ id: userId2 });
		if (!user1 || !user2) {
			console.warn(`🔍 [SECURITY] UndoStroke event for non-existent user`);
			return;
		}

		if (fromUserId !== userId1 && fromUserId !== userId2) {
			console.warn(`🔍 [SECURITY] UndoStroke event from non-participant user ${fromUserId}`);
			return;
		}

		const sortedIds = [userId1, userId2].sort();
		this.globalEventService.publishChatUserStream(sortedIds[0], sortedIds[1], 'undoStroke', undoData);
	}

	/**
	 * ユーザー間チャット用: Redo Stroke配信
	 */
	@bindThis
	public async broadcastUserRedoStroke(userId1: MiUser['id'], userId2: MiUser['id'], fromUserId: MiUser['id'], redoData: any): Promise<void> {
		const user1 = await this.usersRepository.findOneBy({ id: userId1 });
		const user2 = await this.usersRepository.findOneBy({ id: userId2 });
		if (!user1 || !user2) {
			console.warn(`🔍 [SECURITY] RedoStroke event for non-existent user`);
			return;
		}

		if (fromUserId !== userId1 && fromUserId !== userId2) {
			console.warn(`🔍 [SECURITY] RedoStroke event from non-participant user ${fromUserId}`);
			return;
		}

		const sortedIds = [userId1, userId2].sort();
		this.globalEventService.publishChatUserStream(sortedIds[0], sortedIds[1], 'redoStroke', redoData);
	}

	/**
	 * ユーザー間チャット用: Canvas Size Change配信
	 */
	@bindThis
	public async broadcastUserCanvasSizeChange(userId1: MiUser['id'], userId2: MiUser['id'], fromUserId: MiUser['id'], sizeData: any): Promise<void> {
		const user1 = await this.usersRepository.findOneBy({ id: userId1 });
		const user2 = await this.usersRepository.findOneBy({ id: userId2 });
		if (!user1 || !user2) {
			console.warn(`🔍 [SECURITY] CanvasSizeChange event for non-existent user`);
			return;
		}

		if (fromUserId !== userId1 && fromUserId !== userId2) {
			console.warn(`🔍 [SECURITY] CanvasSizeChange event from non-participant user ${fromUserId}`);
			return;
		}

		const sortedIds = [userId1, userId2].sort();
		this.globalEventService.publishChatUserStream(sortedIds[0], sortedIds[1], 'canvasSizeChange', sizeData);
	}
}
