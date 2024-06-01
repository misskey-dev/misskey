/*
 * SPDX-FileCopyrightText: yukineko and tai-cat
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoteNotificationsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteNotificationEntityService } from '@/core/entities/NoteNotificationEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['users'],

	requireCredential: true,
	kind: 'write:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'NoteNotification',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noteNotificationsRepository)
		private noteNotificationsRepository: NoteNotificationsRepository,

		private noteNotificationEntityService: NoteNotificationEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.noteNotificationsRepository.createQueryBuilder('notification'), ps.sinceId, ps.untilId)
				.andWhere('notification.userId = :meId', { meId: me.id });

			const targets = await query
				.take(ps.limit)
				.getMany();

			return await this.noteNotificationEntityService.packMany(targets, me);
		});
	}
}
