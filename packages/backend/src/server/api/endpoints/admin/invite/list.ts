/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistrationTicketsRepository } from '@/models/_.js';
import { InviteCodeEntityService } from '@/core/entities/InviteCodeEntityService.js';
import { DI } from '@/di-symbols.js';
import { packedInviteCodeSchema } from '@/models/schema/invite-code.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:invite-codes',

	res: v.array(packedInviteCodeSchema),
} as const;

export const paramDef = v.object({
	limit: v.optional(mi.integer({ min: 1, max: 100 }), 30),
	offset: v.optional(mi.integer(), 0),
	type: v.optional(v.picklist(['unused', 'used', 'expired', 'all']), 'all'),
	sort: v.optional(v.picklist(['+createdAt', '-createdAt', '+usedAt', '-usedAt'])),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private inviteCodeEntityService: InviteCodeEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.registrationTicketsRepository.createQueryBuilder('ticket')
				.leftJoinAndSelect('ticket.createdBy', 'createdBy')
				.leftJoinAndSelect('ticket.usedBy', 'usedBy');

			switch (ps.type) {
				case 'unused': query.andWhere('ticket.usedBy IS NULL'); break;
				case 'used': query.andWhere('ticket.usedBy IS NOT NULL'); break;
				case 'expired': query.andWhere('ticket.expiresAt < :now', { now: new Date() }); break;
			}

			switch (ps.sort) {
				case '+createdAt': query.orderBy('ticket.id', 'DESC'); break;
				case '-createdAt': query.orderBy('ticket.id', 'ASC'); break;
				case '+usedAt': query.orderBy('ticket.usedAt', 'DESC', 'NULLS LAST'); break;
				case '-usedAt': query.orderBy('ticket.usedAt', 'ASC', 'NULLS FIRST'); break;
				default: query.orderBy('ticket.id', 'DESC'); break;
			}

			query.limit(ps.limit);
			query.offset(ps.offset);

			const tickets = await query.getMany();

			return await this.inviteCodeEntityService.packMany(tickets, me);
		});
	}
}
