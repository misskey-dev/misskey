/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { ScheduledNotesRepository } from '@/models/_.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { QueryService } from '@/core/QueryService.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	requireRolePolicy: 'canScheduleNote',
	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
		},
	},

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	},
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.scheduledNotesRepository)
		private scheduledNotesRepository: ScheduledNotesRepository,

		private idService: IdService,
		private userEntityService: UserEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.scheduledNotesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
				.andWhere('note.userId = :userId', { userId: me.id });

			const scheduleNotes = await query.limit(ps.limit).getMany();
			const user = await this.userEntityService.pack(me, me);
			const scheduleNotesPack = scheduleNotes.map((item) => {
				return {
					...item,
					scheduledAt: new Date(item.scheduledAt).toISOString(),
					note: {
						...item.note,
						user: user,
						createdAt: new Date(item.scheduledAt).toISOString(),
						isSchedule: true,
						id: null,
						scheduledNoteId: item.id,
					},
				};
			});

			return scheduleNotesPack;
		});
	}
}
