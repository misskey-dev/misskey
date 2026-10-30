/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ChatService } from '@/core/ChatService.js';
import { ChatEntityService } from '@/core/entities/ChatEntityService.js';
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
			ref: 'ChatMessage',
		},
	},

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		room: { type: 'boolean', default: false },
	},
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private chatEntityService: ChatEntityService,
		private chatService: ChatService,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.chatService.checkChatAvailability(me.id, 'read');

			const history = ps.room ? await this.chatService.roomHistory(me.id, ps.limit) : await this.chatService.userHistory(me.id, ps.limit);

			const packedMessages = await this.chatEntityService.packMessagesDetailed(history, me);

			if (ps.room) {
				const roomIds = history.map(m => m.toRoomId!);
				const readStateMap = await this.chatService.getRoomReadStateMap(me.id, roomIds);

				for (const message of packedMessages) {
					message.isRead = readStateMap[message.toRoomId!] ?? false;
				}
			} else {
				const otherIds = history.map(m => m.fromUserId === me.id ? m.toUserId! : m.fromUserId!);
				const readStateMap = await this.chatService.getUserReadStateMap(me.id, otherIds);

				for (const message of packedMessages) {
					const otherId = message.fromUserId === me.id ? message.toUserId! : message.fromUserId!;
					message.isRead = readStateMap[otherId] ?? false;
				}
			}

			return packedMessages;
		});
	}
}
