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
import { ApiError } from '@/server/api/error.js';
import { ChatEntityService } from '@/core/entities/ChatEntityService.js';
import { IdService } from '@/core/IdService.js';
import { packedChatRoomMembershipSchema } from '@/models/schema/chat-room-membership.js';

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	kind: 'write:chat',

	res: v.array(packedChatRoomMembershipSchema),

	errors: {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: '7b9fe84c-eafc-4d21-bf89-485458ed2c18',
		},
	},
} as const;

export const paramDef = v.object({
	roomId: mi.misskeyId(),
	...mi.paginationEntries({ max: 100, default: 30 }),
	...mi.paginationDateEntries(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private chatService: ChatService,
		private chatEntityService: ChatEntityService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

			await this.chatService.checkChatAvailability(me.id, 'read');

			const room = await this.chatService.findRoomById(ps.roomId);
			if (room == null) {
				throw new ApiError(meta.errors.noSuchRoom);
			}

			if (!(await this.chatService.isRoomMember(room, me.id))) {
				throw new ApiError(meta.errors.noSuchRoom);
			}

			const memberships = await this.chatService.getRoomMembershipsWithPagination(room.id, ps.limit, sinceId, untilId);

			return this.chatEntityService.packRoomMemberships(memberships, me, {
				populateUser: true,
				populateRoom: false,
			});
		});
	}
}
