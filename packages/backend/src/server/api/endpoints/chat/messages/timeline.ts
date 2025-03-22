/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ChatService } from '@/core/ChatService.js';
import { ChatMessageEntityService } from '@/core/entities/ChatMessageEntityService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	kind: 'read:chat',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'ChatMessageLite',
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '11795c64-40ea-4198-b06e-3c873ed9039d',
		},

		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'c4d9f88c-9270-4632-b032-6ed8cee36f7f',
		},

		roomAccessDenied: {
			message: 'You can not read messages of rooms that you have not joined.',
			code: 'ROOM_ACCESS_DENIED',
			id: 'a053a8dd-a491-4718-8f87-50775aad9284',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		userId: { type: 'string', format: 'misskey:id', nullable: true },
	},
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private chatMessageEntityService: ChatMessageEntityService,
		private chatService: ChatService,
		private getterService: GetterService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.userId != null) {
				const other = await this.getterService.getUser(ps.userId).catch(err => {
					if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
					throw err;
				});

				const messages = await this.chatService.userTimeline(me.id, other.id, ps.sinceId, ps.untilId, ps.limit);

				this.chatService.readUserChatMessage(me.id, other.id);

				return await this.chatMessageEntityService.packLiteMany(messages);
			}/* else if (ps.roomId != null) {
				// Fetch recipient (room)
				const recipientRoom = await this.userRoomRepository.findOneBy({ id: ps.roomId });

				if (recipientRoom == null) {
					throw new ApiError(meta.errors.noSuchRoom);
				}

				// check joined
				const joining = await this.userRoomJoiningsRepository.findOneBy({
					userId: me.id,
					userRoomId: recipientRoom.id,
				});

				if (joining == null) {
					throw new ApiError(meta.errors.roomAccessDenied);
				}

				const query = this.queryService.makePaginationQuery(this.chatMessagesRepository.createQueryBuilder('message'), ps.sinceId, ps.untilId)
					.andWhere('message.roomId = :roomId', { roomId: recipientRoom.id });

				const messages = await query.take(ps.limit).getMany();

				// Mark all as read
				if (ps.markAsRead) {
					this.chatService.readRoomMessagingMessage(me.id, recipientRoom.id, messages.map(x => x.id));
				}

				return await Promise.all(messages.map(message => this.chatMessageEntityService.pack(message, me, {
					populateRoom: false,
				})));
			}*/
		});
	}
}
