/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ChatService } from '@/core/ChatService.js';
import { ChatEntityService } from '@/core/entities/ChatEntityService.js';
import { ApiError } from '@/server/api/error.js';
import { packedChatMessageSchema } from '@/models/schema/chat-message.js';

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	kind: 'read:chat',

	res: v.array(packedChatMessageSchema),

	errors: {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '460b3669-81b0-4dc9-a997-44442141bf83',
		},
	},
} as const;

export const paramDef = v.object({
	query: v.pipe(v.string(), mi.minCodePoints(1), mi.maxCodePoints(256)),
	limit: mi.limit({ max: 100, def: 10 }),
	userId: v.optional(v.nullable(mi.misskeyId())),
	roomId: v.optional(v.nullable(mi.misskeyId())),
});

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
