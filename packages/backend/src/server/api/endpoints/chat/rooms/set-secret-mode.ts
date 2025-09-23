/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ChatService } from '@/core/ChatService.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';
import type { ChatRoomsRepository } from '@/models/_.js';

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	kind: 'write:chat',

	errors: {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '70ca08ba-6865-4630-b6fb-8494759aa754',
		},

		accessDenied: {
			message: 'You are not the owner of this room.',
			code: 'ACCESS_DENIED',
			id: '78a07b61-c344-4339-b2c2-140ea33a3c2b',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		roomId: { type: 'string', format: 'misskey:id' },
		isSecretMessageMode: { type: 'boolean' },
	},
	required: ['roomId', 'isSecretMessageMode'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.chatRoomsRepository)
		private chatRoomsRepository: ChatRoomsRepository,

		private chatService: ChatService,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.chatService.checkChatAvailability(me.id, 'write');

			const room = await this.chatRoomsRepository.findOneBy({ id: ps.roomId });

			if (room == null) {
				throw new ApiError(meta.errors.noSuchRoom);
			}

			// Only room owner can change secret mode
			if (room.ownerId !== me.id) {
				throw new ApiError(meta.errors.accessDenied);
			}

			await this.chatService.setSecretModeForRoom(room.id, ps.isSecretMessageMode, me.id);

			return {};
		});
	}
}