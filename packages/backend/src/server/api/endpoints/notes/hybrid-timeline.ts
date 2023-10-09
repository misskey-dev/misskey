/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import type { NotesRepository, FollowingsRepository, MiNote } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { CacheService } from '@/core/CacheService.js';
import { RedisTimelineService } from '@/core/RedisTimelineService.js';
import { ApiError } from '../../error.js';
import {QueryService} from "@/core/QueryService.js";

export const meta = {
	tags: ['notes'],

	requireCredential: true,

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
		stlDisabled: {
			message: 'Hybrid timeline has been disabled.',
			code: 'STL_DISABLED',
			id: '620763f4-f621-4533-ab33-0577a1a3c342',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
		includeMyRenotes: { type: 'boolean', default: true },
		includeRenotedMyNotes: { type: 'boolean', default: true },
		includeLocalRenotes: { type: 'boolean', default: true },
		withFiles: { type: 'boolean', default: false },
		withRenotes: { type: 'boolean', default: true },
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

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private roleService: RoleService,
		private activeUsersChart: ActiveUsersChart,
		private idService: IdService,
		private cacheService: CacheService,
		private redisTimelineService: RedisTimelineService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const untilId = ps.untilId ?? ps.untilDate ? this.idService.genId(new Date(ps.untilDate!)) : null;
			const sinceId = ps.sinceId ?? ps.sinceDate ? this.idService.genId(new Date(ps.sinceDate!)) : null;

			const policies = await this.roleService.getUserPolicies(me.id);
			if (!policies.ltlAvailable) {
				throw new ApiError(meta.errors.stlDisabled);
			}

			const [
				userIdsWhoMeMuting,
				userIdsWhoMeMutingRenotes,
				userIdsWhoBlockingMe,
			] = await Promise.all([
				this.cacheService.userMutingsCache.fetch(me.id),
				this.cacheService.renoteMutingsCache.fetch(me.id),
				this.cacheService.userBlockedCache.fetch(me.id),
			]);

			const [htlNoteIds, ltlNoteIds] = await this.redisTimelineService.getMulti([
				ps.withFiles ? `homeTimelineWithFiles:${me.id}` : `homeTimeline:${me.id}`,
				ps.withFiles ? 'localTimelineWithFiles' : 'localTimeline',
			], untilId, sinceId);

			let noteIds = Array.from(new Set([...htlNoteIds, ...ltlNoteIds]));
			noteIds.sort((a, b) => a > b ? -1 : 1);
			noteIds = noteIds.slice(0, ps.limit);
			if (noteIds.length < ps.limit) {
				const followingQuery = this.followingsRepository.createQueryBuilder('following')
					.select('following.followeeId')
					.where('following.followerId = :followerId', { followerId: me.id });
				const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'),
					ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
					.andWhere('note.id > :minId', { minId: this.idService.genId(new Date(Date.now() - (1000 * 60 * 60 * 24 * 10))) }) // 10日前まで
					.andWhere(new Brackets(qb => {
						qb.where(`((note.userId IN (${ followingQuery.getQuery() })) OR (note.userId = :meId))`, { meId: me.id })
							.orWhere('(note.visibility = \'public\') AND (note.userHost IS NULL)');
					}))
					.innerJoinAndSelect('note.user', 'user')
					.leftJoinAndSelect('note.reply', 'reply')
					.leftJoinAndSelect('note.renote', 'renote')
					.leftJoinAndSelect('reply.user', 'replyUser')
					.leftJoinAndSelect('renote.user', 'renoteUser')
					.setParameters(followingQuery.getParameters());

				this.queryService.generateChannelQuery(query, me);
				this.queryService.generateVisibilityQuery(query, me);
				this.queryService.generateMutedUserQuery(query, me);
				this.queryService.generateBlockedUserQuery(query, me);
				this.queryService.generateMutedUserRenotesQueryForNotes(query, me);

				if (ps.includeMyRenotes === false) {
					query.andWhere(new Brackets(qb => {
						qb.orWhere('note.userId != :meId', { meId: me.id });
						qb.orWhere('note.renoteId IS NULL');
						qb.orWhere('note.text IS NOT NULL');
						qb.orWhere('note.fileIds != \'{}\'');
						qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
					}));
				}

				if (ps.includeRenotedMyNotes === false) {
					query.andWhere(new Brackets(qb => {
						qb.orWhere('note.renoteUserId != :meId', { meId: me.id });
						qb.orWhere('note.renoteId IS NULL');
						qb.orWhere('note.text IS NOT NULL');
						qb.orWhere('note.fileIds != \'{}\'');
						qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
					}));
				}

				if (ps.includeLocalRenotes === false) {
					query.andWhere(new Brackets(qb => {
						qb.orWhere('note.renoteUserHost IS NOT NULL');
						qb.orWhere('note.renoteId IS NULL');
						qb.orWhere('note.text IS NOT NULL');
						qb.orWhere('note.fileIds != \'{}\'');
						qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
					}));
				}

				if (ps.withFiles) {
					query.andWhere('note.fileIds != \'{}\'');
				}
				//#endregion
				const ids = await query.limit(ps.limit - noteIds.length).getMany();
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

			let timeline = await query.getMany();

			timeline = timeline.filter(note => {
				if (note.userId === me.id) {
					return true;
				}
				if (isUserRelated(note, userIdsWhoBlockingMe)) return false;
				if (isUserRelated(note, userIdsWhoMeMuting)) return false;
				if (note.renoteId) {
					if (note.text == null && note.fileIds.length === 0 && !note.hasPoll) {
						if (isUserRelated(note, userIdsWhoMeMutingRenotes)) return false;
						if (ps.withRenotes === false) return false;
					}
				}

				return true;
			});

			// TODO: フィルタした結果件数が足りなかった場合の対応

			timeline.sort((a, b) => a.id > b.id ? -1 : 1);

			process.nextTick(() => {
				this.activeUsersChart.read(me);
			});

			return await this.noteEntityService.packMany(timeline, me);
		});
	}
}
