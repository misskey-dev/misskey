/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { ChatService } from '@/core/ChatService.js';
import { ChatEntityService } from '@/core/entities/ChatEntityService.js';
import { IdService } from '@/core/IdService.js';
import { packedChatRoomInvitationSchema } from '@/models/schema/chat-room-invitation.js';

export const meta = {
	tags: ['chat'],

	requireCredential: true,

	kind: 'read:chat',

	res: v.array(packedChatRoomInvitationSchema),

	errors: {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'a3c6b309-9717-4316-ae94-a69b53437237',
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

			const room = await this.chatService.findMyRoomById(me.id, ps.roomId);
			if (room == null) {
				throw new ApiError(meta.errors.noSuchRoom);
			}

			const invitations = await this.chatService.getSentRoomInvitationsWithPagination(ps.roomId, ps.limit, sinceId, untilId);
			return this.chatEntityService.packRoomInvitations(invitations, me);
		});
	}
}
