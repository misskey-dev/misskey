/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import type { MiNote, NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import { CacheService } from '@/core/CacheService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { RedisTimelineService } from '@/core/RedisTimelineService.js';
import { ApiError } from '../../error.js';
import {QueryService} from "@/core/QueryService.js";

export const meta = {
	tags: ['notes'],

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},

	errors: {
		ltlDisabled: {
			message: 'Local timeline has been disabled.',
			code: 'LTL_DISABLED',
			id: '45a6eb02-7695-4393-b023-dd3be9aaaefd',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		withFiles: { type: 'boolean', default: false },
		withRenotes: { type: 'boolean', default: true },
		excludeNsfw: { type: 'boolean', default: false },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.redisForTimelines)
		private redisForTimelines: Redis.Redis,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private roleService: RoleService,
		private queryService: QueryService,
		private activeUsersChart: ActiveUsersChart,
		private idService: IdService,
		private cacheService: CacheService,
		private redisTimelineService: RedisTimelineService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const policies = await this.roleService.getUserPolicies(me ? me.id : null);
			if (!policies.ltlAvailable) {
				throw new ApiError(meta.errors.ltlDisabled);
			}

			const [
				userIdsWhoMeMuting,
				userIdsWhoMeMutingRenotes,
				userIdsWhoBlockingMe,
			] = me ? await Promise.all([
				this.cacheService.userMutingsCache.fetch(me.id),
				this.cacheService.renoteMutingsCache.fetch(me.id),
				this.cacheService.userBlockedCache.fetch(me.id),
			]) : [new Set<string>(), new Set<string>(), new Set<string>()];

			let timeline: MiNote[] = [];

			const limit = ps.limit + (ps.untilId ? 1 : 0) + (ps.sinceId ? 1 : 0); // untilIdに指定したものも含まれるため+1
			let noteIdsRes: [string, string[]][] = [];

			if (!ps.sinceId && !ps.sinceDate) {
				noteIdsRes = await this.redisForTimelines.xrevrange(
					ps.withFiles ? 'localTimelineWithFiles' : 'localTimeline',
					ps.untilId ? this.idService.parse(ps.untilId).date.getTime() : ps.untilDate ?? '+',
					ps.sinceId ? this.idService.parse(ps.sinceId).date.getTime() : ps.sinceDate ?? '-',
					'COUNT', limit);
			}

			let noteIds = noteIdsRes.map(x => x[1][1]).filter(x => x !== ps.untilId && x !== ps.sinceId);

			if (noteIds.length < limit) {
				//#region Construct query
				const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'),
					ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
					.andWhere('note.id > :minId', { minId: this.idService.genId(new Date(Date.now() - (1000 * 60 * 60 * 24 * 10))) }) // 10日前まで
					.andWhere('(note.visibility = \'public\') AND (note.userHost IS NULL)')
					.innerJoinAndSelect('note.user', 'user')
					.leftJoinAndSelect('note.reply', 'reply')
					.leftJoinAndSelect('note.renote', 'renote')
					.leftJoinAndSelect('reply.user', 'replyUser')
					.leftJoinAndSelect('renote.user', 'renoteUser');

				this.queryService.generateChannelQuery(query, me);
				this.queryService.generateVisibilityQuery(query, me);
				if (me) this.queryService.generateMutedUserQuery(query, me);
				if (me) this.queryService.generateBlockedUserQuery(query, me);
				if (me) this.queryService.generateMutedUserRenotesQueryForNotes(query, me);

				if (ps.withFiles) {
					query.andWhere('note.fileIds != \'{}\'');
				}


				if (ps.withRenotes === false) {
					query.andWhere(new Brackets(qb => {
						qb.orWhere('note.renoteId IS NULL');
						qb.orWhere(new Brackets(qb => {
							qb.orWhere('note.text IS NOT NULL');
							qb.orWhere('note.fileIds != \'{}\'');
						}));
					}));
				}
				const ids = await query.limit(limit - noteIds.length).getMany();
				noteIds = noteIds.concat(ids.map(note => note.id));
			}

			if (noteIds.length === 0) {
				return [];
			}

			const query = this.notesRepository.createQueryBuilder('note')
				.where('note.id IN (:...noteIds)', { noteIds: noteIds })
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser')
				.leftJoinAndSelect('note.channel', 'channel');

			timeline = await query.getMany();

			timeline = timeline.filter(note => {
				if (me && (note.userId === me.id)) {
					return true;
				}
				if (me && isUserRelated(note, userIdsWhoBlockingMe)) return false;
				if (me && isUserRelated(note, userIdsWhoMeMuting)) return false;
				if (note.renoteId) {
					if (note.text == null && note.fileIds.length === 0 && !note.hasPoll) {
						if (me && isUserRelated(note, userIdsWhoMeMutingRenotes)) return false;
						if (ps.withRenotes === false) return false;
					}
				}

				return true;
			});

			timeline.sort((a, b) => a.id > b.id ? -1 : 1);

			process.nextTick(() => {
				if (me) {
					this.activeUsersChart.read(me);
				}
			});

			return await this.noteEntityService.packMany(timeline, me);
		});
	}
}
