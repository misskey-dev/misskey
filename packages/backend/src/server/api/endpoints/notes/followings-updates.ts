/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Datasource } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository, ChannelFollowingsRepository, MiMeta } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { CacheService } from '@/core/CacheService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { MiLocalUser } from '@/models/User.js';
import { FanoutTimelineEndpointService } from '@/core/FanoutTimelineEndpointService.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		anchorId: { type: 'string', format: 'misskey:id' },
		anchorDate: { type: 'integer' },
		offset: { type: 'integer', minimum: 0, default: 0 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.db)
		private db: DataSource,

		private noteEntityService: NoteEntityService,
		private activeUsersChart: ActiveUsersChart,
		private idService: IdService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const anchorId = ps.anchorId ?? this.idService.gen(ps.anchorDate);

			const updates = await this.getFromDb({
				anchorId,
				offset: ps.offset,
				limit: ps.limit,
			}, me);

			process.nextTick(() => {
				this.activeUsersChart.read(me);
			});

			for (const update of updates) {
				update.notes = await this.noteEntityService.packMany(update.notes, me);
			}
			return updates;
		});
	}

	private async getFromDb(ps: { anchorId: string | null; offset: number; limit: number; }, me: MiLocalUser) {
		//#region Construct query
		const updatedUsers = await this.db.query(`SELECT c."userId" as user, d.m as last FROM ( SELECT DISTINCT ON (f."followeeId") f."followeeId" AS "userId" FROM "following" f JOIN "note" n ON n."userId" = f."followeeId" WHERE f."followerId" = $1 AND n."id" > $2 AND n."visibility" <> 'specified' AND n."renoteId" IS NULL AND n."replyId" IS NULL ORDER BY f."followeeId", n."id" DESC) AS c LEFT JOIN LATERAL ( SELECT "id" AS m FROM "note" WHERE "userId" = c."userId" AND "id" <= $2 AND note."visibility" <> 'specified' AND note."renoteId" IS NULL AND note."replyId" IS NULL ORDER BY "id" DESC LIMIT 1) AS d ON true ORDER BY d.m ASC NULLS FIRST OFFSET $3 LIMIT $4`, [ me.id, ps.anchorId, ps.offset, ps.limit ]);

		return await Promise.all(updatedUsers.map(async (row) => {
			const userId = row.user;
			const query = this.notesRepository.createQueryBuilder('note').innerJoinAndSelect('note.user', 'user');

			this.queryService.generateVisibilityQuery(query, me);
			this.queryService.generateMutedUserQuery(query, me);
			this.queryService.generateBlockedUserQuery(query, me);
			this.queryService.generateMutedUserRenotesQueryForNotes(query, me);

			query.andWhere('note.renoteId IS NULL');
			query.andWhere('note.replyId IS NULL');
			query.andWhere('note.userId = :userId', { userId });
			query.andWhere('note.id > :anchorId', { anchorId: ps.anchorId });
			query.orderBy('note.id', 'DESC');
			query.limit(3);

			return { id: userId, notes: await query.getMany(), last: row.last };
		}));
	}
}
