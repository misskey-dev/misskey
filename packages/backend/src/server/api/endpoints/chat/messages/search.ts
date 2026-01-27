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
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '460b3669-81b0-4dc9-a997-44442141bf83',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		query: { type: 'string', minLength: 1, maxLength: 256 },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		userId: { type: 'string', format: 'misskey:id', nullable: true },
		roomId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: ['query'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private chatEntityService: ChatEntityService,
		private chatService: ChatService,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.chatService.checkChatAvailability(me.id, 'read');

			if (ps.roomId != null) {
				const room = await this.chatService.findRoomById(ps.roomId);
				if (room == null) {
					throw new ApiError(meta.errors.noSuchRoom);
				}

				if (!(await this.chatService.isRoomMember(room, me.id))) {
					throw new ApiError(meta.errors.noSuchRoom);
				}
			}

			const messages = await this.chatService.searchMessages(me.id, ps.query, ps.limit, {
				userId: ps.userId,
				roomId: ps.roomId,
			});

			return await this.chatEntityService.packMessagesDetailed(messages, me);
		});
	}
}
