/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ChatService } from '@/core/ChatService.js';
import { ApiError } from '@/server/api/error.js';
import type { ChatRoomsRepository } from '@/models/_.js';

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	kind: 'write:chat',

	errors: {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '84416476-5ce8-4a2c-b568-9569f1b10733',
		},
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '7ad07a5a-0e1a-4c29-9a5b-3c9a6d6e7e1a',
		},
		yourself: {
			message: 'You cannot invite yourself.',
			code: 'YOURSELF',
			id: '2d4a8b5c-3e7f-4a9b-8c1d-5e6f7a8b9c0d',
		},
		alreadyMember: {
			message: 'User is already a member of this room.',
			code: 'ALREADY_MEMBER',
			id: '3f9a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c',
		},
		alreadyInvited: {
			message: 'User is already invited to this room.',
			code: 'ALREADY_INVITED',
			id: '5c7b8a9d-6e0f-1a2b-3c4d-5e6f7a8b9c0d',
		},
		accessDenied: {
			message: 'Access denied. Only room owner can invite users.',
			code: 'ACCESS_DENIED',
			id: '6d8c9b0e-7f1a-2b3c-4d5e-6f7a8b9c0d1e',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		roomId: { type: 'string', format: 'misskey:id' },
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['roomId', 'userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private chatService: ChatService,
		@Inject(DI.chatRoomsRepository)
		private chatRoomsRepository: ChatRoomsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.chatService.checkChatAvailability(me.id, 'write');

			try {
				// Check if user is room owner
				const room = await this.chatRoomsRepository.findOneBy({ id: ps.roomId });
				if (!room) {
					throw new ApiError(meta.errors.noSuchRoom);
				}

				if (room.ownerId !== me.id) {
					throw new ApiError(meta.errors.accessDenied);
				}

				await this.chatService.createRoomInvitation(me.id, ps.roomId, ps.userId);

				// Update room updatedAt
				await this.chatRoomsRepository.update(ps.roomId, {
					updatedAt: new Date(),
				});
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === 'yourself') {
						throw new ApiError(meta.errors.yourself);
					} else if (error.message === 'already member') {
						throw new ApiError(meta.errors.alreadyMember);
					} else if (error.message === 'already invited') {
						throw new ApiError(meta.errors.alreadyInvited);
					}
				}
				throw error;
			}
		});
	}
}