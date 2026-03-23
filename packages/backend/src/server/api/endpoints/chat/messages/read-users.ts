/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ChatService } from '@/core/ChatService.js';
import { DI } from '@/di-symbols.js';
import type { ChatMessagesRepository, UsersRepository } from '@/models/_.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	kind: 'read:chat',

	errors: {
		noSuchMessage: {
			message: 'No such message.',
			code: 'NO_SUCH_MESSAGE',
			id: 'c3c3c32a-2e96-4aeb-b5e8-cd7d5b8d9a6e',
		},
	},

	res: {
		type: 'array',
		items: {
			type: 'object',
			ref: 'UserLite',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		messageId: { type: 'string', format: 'misskey:id' },
	},
	required: ['messageId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private chatService: ChatService,
		@Inject(DI.chatMessagesRepository)
		private chatMessagesRepository: ChatMessagesRepository,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.chatService.checkChatAvailability(me.id, 'read');

			const message = await this.chatMessagesRepository.findOne({
				where: { id: ps.messageId },
				relations: ['toUser', 'toRoom'],
			});

			if (!message) {
				throw new ApiError(meta.errors.noSuchMessage);
			}

			// アクセス権限チェック
			if (message.toUser) {
				// 1対1チャットの場合: 送信者と受信者のみがアクセス可能
				if (message.fromUserId !== me.id && message.toUserId !== me.id) {
					throw new ApiError(meta.errors.noSuchMessage);
				}
			} else if (message.toRoom) {
				// ルームチャットの場合: ルームメンバーまたはオーナーのみがアクセス可能
				const room = message.toRoom;
				if (!room) {
					throw new ApiError(meta.errors.noSuchMessage);
				}

				// オーナーかどうかチェック
				if (me.id === room.ownerId) {
					// オーナーならアクセス可能
				} else {
					// メンバーかどうかチェック
					const membership = await this.chatService.checkMembership(message.toRoom.id, me.id);
					if (!membership) {
						throw new ApiError(meta.errors.noSuchMessage);
					}
				}
			}

			// 既読ユーザー情報を取得
			if (!message.reads || message.reads.length === 0) {
				return [];
			}

			const readUsers = await this.usersRepository
				.createQueryBuilder('user')
				.whereInIds(message.reads)
				.getMany();

			return await Promise.all(
				readUsers.map(user => this.userEntityService.pack(user, me, { schema: 'UserLite' }))
			);
		});
	}
}
