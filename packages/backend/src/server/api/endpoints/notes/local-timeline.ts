/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import type { MiNote, NotesRepository, FollowingsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import { CacheService } from '@/core/CacheService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { RedisTimelineService } from '@/core/RedisTimelineService.js';
import { ApiError } from '../../error.js';

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
		withReplies: { type: 'boolean', default: false },
		withBelowPublic: { type: 'boolean', default: false },
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
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.genId(new Date(ps.untilDate!)) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.genId(new Date(ps.sinceDate!)) : null);

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

			let noteIds: string[];

			if (ps.withFiles) {
				noteIds = await this.redisTimelineService.get('localTimelineWithFiles', untilId, sinceId);
			} else {
				if (me) {
					const [nonReplyNoteIds, replyNoteIds, localHomeNoteIds] = await this.redisTimelineService.getMulti([
						'localTimeline',
						'localTimelineWithReplies',
						`localHomeTimeline:${me.id}`,
					], untilId, sinceId);

					noteIds = Array.from(new Set([...nonReplyNoteIds, ...replyNoteIds, ...localHomeNoteIds]));
				} else {
					const [nonReplyNoteIds, replyNoteIds] = await this.redisTimelineService.getMulti([
						'localTimeline',
						'localTimelineWithReplies',
					], untilId, sinceId);

					noteIds = Array.from(new Set([...nonReplyNoteIds, ...replyNoteIds]));
				}

				noteIds.sort((a, b) => a > b ? -1 : 1);
			}

			noteIds = noteIds.slice(0, ps.limit);

			if (noteIds.length > 0) {
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
					if (me && (note.userId === me.id)) {
						return true;
					}
					if (!ps.withReplies && note.replyId && (me == null || note.replyUserId !== me.id)) return false;
					if (!ps.withBelowPublic && note.visibility !== 'public') return false;
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

				// TODO: フィルタした結果件数が足りなかった場合の対応

				timeline.sort((a, b) => a.id > b.id ? -1 : 1);

				process.nextTick(() => {
					if (me) {
						this.activeUsersChart.read(me);
					}
				});

				if (timeline.length > 0) {
					return await this.noteEntityService.packMany(timeline, me);
				}
			}
			//TODO: 将来的に削除する
			//#region fallback to db
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'),
				ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('note.id > :minId', { minId: this.idService.genId(new Date(Date.now() - (1000 * 60 * 60 * 24 * 20))) }); // 20日前まで

			if (me && ps.withBelowPublic) {
				const localFollowees = await this.followingsRepository.createQueryBuilder('following')
					.select('following.followeeId')
					.where('following.followeeHost IS NULL')
					.andWhere('following.followerId = :followerId', { followerId: me.id })
					.getMany();

				if (localFollowees.length > 0) {
					const meOrFolloweeIds = [me.id, ...localFollowees.map(f => f.followeeId)];

					query.andWhere(new Brackets(qb => {
						qb.where('(note.userId IN (:...meOrFolloweeIds) )', { meOrFolloweeIds: meOrFolloweeIds })
							.orWhere('(note.visibility = \'public\') AND (note.userHost IS NULL)');
					}));
				} else {
					query.andWhere(new Brackets(qb => {
						qb.where('(note.userId = :meId)', { meId: me.id })
							.orWhere('(note.visibility = \'public\') AND (note.userHost IS NULL)');
					}));
				}
			} else {
				query.andWhere('(note.visibility = \'public\') AND (note.userHost IS NULL)');
			}

			this.queryService.generateChannelQuery(query, me);
			this.queryService.generateRepliesQuery(query, ps.withReplies, me);
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

			let timeline = await query.limit(ps.limit).getMany();
			timeline = timeline.filter(note => {
				if (me && (note.userId === me.id)) {
					return true;
				}
				if (!ps.withReplies && note.replyId && (me == null || note.replyUserId !== me.id)) return false;
				if (!ps.withBelowPublic && note.visibility !== 'public') return false;
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

			process.nextTick(() => {
				if (me) {
					this.activeUsersChart.read(me);
				}
			});

			return await this.noteEntityService.packMany(timeline, me);
			//#endregion
		});
	}
}
