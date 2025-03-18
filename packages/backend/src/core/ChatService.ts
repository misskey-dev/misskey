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
import { ChatMessageEntityService } from '@/core/entities/ChatMessageEntityService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { PushNotificationService } from '@/core/PushNotificationService.js';
import { bindThis } from '@/decorators.js';
import type { ChatMessagesRepository, MiChatMessage, MiDriveFile, MiUser, MutingsRepository, UsersRepository } from '@/models/_.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { QueryService } from '@/core/QueryService.js';

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

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private userEntityService: UserEntityService,
		private chatMessageEntityService: ChatMessageEntityService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
		private apRendererService: ApRendererService,
		private queueService: QueueService,
		private pushNotificationService: PushNotificationService,
		private userBlockingService: UserBlockingService,
		private queryService: QueryService,
	) {
	}

	@bindThis
	public async createMessage(params: {
		fromUser: { id: MiUser['id']; host: MiUser['host']; };
		toUser?: MiUser | null;
		//toRoom?: MiUserRoom | null;
		text?: string | null;
		file?: MiDriveFile | null;
		uri?: string | null;
	}) {
		const { fromUser, toUser /*toRoom*/ } = params;

		if (toUser == null /*&& toRoom == null*/) {
			throw new Error('recipient is required');
		}

		if (toUser) {
			const blocked = await this.userBlockingService.checkBlocked(toUser.id, fromUser.id);
			if (blocked) {
				throw new Error('blocked');
			}
		}

		const message = {
			id: this.idService.gen(),
			fromUserId: fromUser.id,
			toUserId: toUser ? toUser.id : null,
			//toRoomId: recipientRoom ? recipientRoom.id : null,
			text: params.text ? params.text.trim() : null,
			fileId: params.file ? params.file.id : null,
			reads: [],
			uri: params.uri ?? null,
		} satisfies Partial<MiChatMessage>;

		const inserted = await this.chatMessagesRepository.insertOne(message);

		const packedMessage = await this.chatMessageEntityService.packLite(inserted);

		if (toUser) {
			const redisPipeline = this.redisClient.pipeline();
			redisPipeline.set(`newChatMessageExists:${toUser.id}:${fromUser.id}`, message.id);
			redisPipeline.sadd(`newChatMessagesExists:${toUser.id}`, `user:${fromUser.id}`);
			redisPipeline.exec();

			if (this.userEntityService.isLocalUser(fromUser)) {
				// 自分のストリーム
				this.globalEventService.publishChatStream(fromUser.id, toUser.id, 'message', packedMessage);
			}

			if (this.userEntityService.isLocalUser(toUser)) {
				// 相手のストリーム
				this.globalEventService.publishChatStream(toUser.id, fromUser.id, 'message', packedMessage);
			}
		}/* else if (toRoom) {
			// グループのストリーム
			this.globalEventService.publishRoomChatStream(toRoom.id, 'message', messageObj);

			// メンバーのストリーム
			const joinings = await this.userRoomJoiningsRepository.findBy({ userRoomId: toRoom.id });
			for (const joining of joinings) {
				this.globalEventService.publishChatIndexStream(joining.userId, 'message', messageObj);
				this.globalEventService.publishMainStream(joining.userId, 'chatMessage', messageObj);
			}
		}*/

		// 3秒経っても既読にならなかったらイベント発行
		setTimeout(async () => {
			if (toUser && this.userEntityService.isLocalUser(toUser)) {
				const marker = await this.redisClient.get(`newChatMessageExists:${toUser.id}:${fromUser.id}`);

				if (marker == null) return; // 既読

				const packedMessageForTo = await this.chatMessageEntityService.pack(inserted, toUser);
				this.globalEventService.publishMainStream(toUser.id, 'newChatMessage', packedMessageForTo);
				this.pushNotificationService.pushNotification(toUser.id, 'newChatMessage', packedMessageForTo);
			}/* else if (toRoom) {
				const joinings = await this.userRoomJoiningsRepository.findBy({ userRoomId: toRoom.id, userId: Not(fromUser.id) });
				for (const joining of joinings) {
					if (freshMessage.reads.includes(joining.userId)) return; // 既読
					this.globalEventService.publishMainStream(joining.userId, 'newChatMessage', messageObj);
					this.pushNotificationService.pushNotification(joining.userId, 'newChatMessage', messageObj);
				}
			}*/
		}, 3000);

		/* TODO: AP
		if (toUser && this.userEntityService.isLocalUser(fromUser) && this.userEntityService.isRemoteUser(toUser)) {
			const note = {
				id: message.id,
				createdAt: message.createdAt,
				fileIds: message.fileId ? [message.fileId] : [],
				text: message.text,
				userId: message.userId,
				visibility: 'specified',
				mentions: [toUser].map(u => u.id),
				mentionedRemoteUsers: JSON.stringify([toUser].map(u => ({
					uri: u.uri,
					username: u.username,
					host: u.host,
				}))),
			} as MiNote;

			const activity = this.apRendererService.addContext(this.apRendererService.renderCreate(await this.apRendererService.renderNote(note, false, true), note));

			this.queueService.deliver(fromUser, activity, toUser.inbox);
		}
			*/

		return packedMessage;
	}

	@bindThis
	public async readUserChatMessage(
		readerId: MiUser['id'],
		senderId: MiUser['id'],
	) {
		const redisPipeline = this.redisClient.pipeline();
		redisPipeline.del(`newChatMessageExists:${readerId}:${senderId}`);
		redisPipeline.srem(`newChatMessagesExists:${readerId}`, `user:${senderId}`);
		redisPipeline.exec();
	}

	@bindThis
	public async deleteMessage(message: MiChatMessage) {
		await this.chatMessagesRepository.delete(message.id);

		if (message.toUserId) {
			const fromUser = await this.usersRepository.findOneByOrFail({ id: message.fromUserId });
			const toUser = await this.usersRepository.findOneByOrFail({ id: message.toUserId });

			if (this.userEntityService.isLocalUser(fromUser)) this.globalEventService.publishChatStream(message.fromUserId, message.toUserId, 'deleted', message.id);
			if (this.userEntityService.isLocalUser(toUser)) this.globalEventService.publishChatStream(message.toUserId, message.fromUserId, 'deleted', message.id);

			if (this.userEntityService.isLocalUser(fromUser) && this.userEntityService.isRemoteUser(toUser)) {
				const activity = this.apRendererService.addContext(this.apRendererService.renderDelete(this.apRendererService.renderTombstone(`${this.config.url}/notes/${message.id}`), fromUser));
				this.queueService.deliver(fromUser, activity, toUser.inbox);
			}
		}/* else if (message.toRoomId) {
			this.globalEventService.publishRoomChatStream(message.toRoomId, 'deleted', message.id);
		}*/
	}

	/*
	@bindThis
	public async readRoomChatMessage(
		userId: MiUser['id'],
		roomId: MiUserRoom['id'],
		messageIds: MiChatMessage['id'][],
	) {
		if (messageIds.length === 0) return;

		// check joined
		const joining = await this.userRoomJoiningsRepository.findOneBy({
			userId: userId,
			userRoomId: roomId,
		});

		if (joining == null) {
			throw new IdentifiableError('930a270c-714a-46b2-b776-ad27276dc569', 'Access denied (room).');
		}

		const messages = await this.chatMessagesRepository.findBy({
			id: In(messageIds),
		});

		const reads: ChatMessage['id'][] = [];

		for (const message of messages) {
			if (message.userId === userId) continue;
			if (message.reads.includes(userId)) continue;

			// Update document
			await this.chatMessagesRepository.createQueryBuilder().update()
				.set({
					reads: (() => `array_append("reads", '${joining.userId}')`) as any,
				})
				.where('id = :id', { id: message.id })
				.execute();

			reads.push(message.id);
		}

		// Publish event
		this.globalEventService.publishRoomChatStream(roomId, 'read', {
			ids: reads,
			userId: userId,
		});
		this.globalEventService.publishChatIndexStream(userId, 'read', reads);

		if (!await this.userEntityService.getHasUnreadChatMessage(userId)) {
		// 全ての(いままで未読だった)自分宛てのメッセージを(これで)読みましたよというイベントを発行
			this.globalEventService.publishMainStream(userId, 'readAllChatMessages');
			this.pushNotificationService.pushNotification(userId, 'readAllChatMessages', undefined);
		} else {
		// そのグループにおいて未読がなければイベント発行
			const unreadExist = await this.chatMessagesRepository.createQueryBuilder('message')
				.where('message.toRoomId = :roomId', { roomId: roomId })
				.andWhere('message.userId != :userId', { userId: userId })
				.andWhere('NOT (:userId = ANY(message.reads))', { userId: userId })
				.andWhere('message.createdAt > :joinedAt', { joinedAt: joining.createdAt }) // 自分が加入する前の会話については、未読扱いしない
				.getOne().then(x => x != null);

			if (!unreadExist) {
				this.pushNotificationService.pushNotification(userId, 'readAllChatMessagesOfARoom', { roomId });
			}
		}
	}
	*/

	@bindThis
	public async userTimeline(meId: MiUser['id'], otherId: MiUser['id'], sinceId: MiChatMessage['id'] | null, untilId: MiChatMessage['id'] | null, limit: number) {
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
		return [];
		/*
		const rooms = await this.userRoomJoiningsRepository.findBy({
			userId: meId,
		}).then(xs => xs.map(x => x.userRoomId));

		if (rooms.length === 0) {
			return [];
		}

		const history: MiChatMessage[] = [];

		for (let i = 0; i < limit; i++) {
			const found = history.map(m => m.roomId!);

			const query = this.chatMessagesRepository.createQueryBuilder('message')
				.orderBy('message.id', 'DESC')
				.where('message.toRoomId IN (:...rooms)', { rooms: rooms });

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
		*/
	}

	@bindThis
	public async getUserReadStateMap(userId: MiUser['id'], otherIds: MiUser['id'][]) {
		const readStateMap: Record<MiUser['id'], boolean> = {};

		const redisPipeline = this.redisClient.pipeline();

		for (const otherId of otherIds) {
			redisPipeline.get(`newChatMessageExists:${userId}:${otherId}`);
		}

		const markers = await redisPipeline.exec();

		for (let i = 0; i < otherIds.length; i++) {
			const marker = markers[i][1];
			readStateMap[otherIds[i]] = marker == null;
		}

		return readStateMap;
	}
}
