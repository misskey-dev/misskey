/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { MiNote, NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import { CacheService } from '@/core/CacheService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { FunoutTimelineService } from '@/core/FunoutTimelineService.js';
import { QueryService } from '@/core/QueryService.js';
import { MetaService } from '@/core/MetaService.js';
import { MiLocalUser } from '@/models/User.js';
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
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private roleService: RoleService,
		private activeUsersChart: ActiveUsersChart,
		private idService: IdService,
		private cacheService: CacheService,
		private funoutTimelineService: FunoutTimelineService,
		private queryService: QueryService,
		private metaService: MetaService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);

			const policies = await this.roleService.getUserPolicies(me ? me.id : null);
			if (!policies.ltlAvailable) {
				throw new ApiError(meta.errors.ltlDisabled);
			}

			const serverSettings = await this.metaService.fetch();

			if (serverSettings.enableFanoutTimeline) {
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
					noteIds = await this.funoutTimelineService.get('localTimelineWithFiles', untilId, sinceId);
				} else {
					const [nonReplyNoteIds, replyNoteIds] = await this.funoutTimelineService.getMulti([
						'localTimeline',
						'localTimelineWithReplies',
					], untilId, sinceId);
					noteIds = Array.from(new Set([...nonReplyNoteIds, ...replyNoteIds]));
					noteIds.sort((a, b) => a > b ? -1 : 1);
				}

				noteIds = noteIds.slice(0, ps.limit);

				let redisTimeline: MiNote[] = [];

				if (noteIds.length > 0) {
					const query = this.notesRepository.createQueryBuilder('note')
						.where('note.id IN (:...noteIds)', { noteIds: noteIds })
						.innerJoinAndSelect('note.user', 'user')
						.leftJoinAndSelect('note.reply', 'reply')
						.leftJoinAndSelect('note.renote', 'renote')
						.leftJoinAndSelect('reply.user', 'replyUser')
						.leftJoinAndSelect('renote.user', 'renoteUser')
						.leftJoinAndSelect('note.channel', 'channel');

					redisTimeline = await query.getMany();

					redisTimeline = redisTimeline.filter(note => {
						if (me && (note.userId === me.id)) {
							return true;
						}
						if (!ps.withReplies && note.replyId && note.replyUserId !== note.userId && (me == null || note.replyUserId !== me.id)) return false;
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

					redisTimeline.sort((a, b) => a.id > b.id ? -1 : 1);
				}

				if (redisTimeline.length > 0) {
					process.nextTick(() => {
						if (me) {
							this.activeUsersChart.read(me);
						}
					});

					return await this.noteEntityService.packMany(redisTimeline, me);
				} else { // fallback to db
					return await this.getFromDb({
						untilId,
						sinceId,
						limit: ps.limit,
						withFiles: ps.withFiles,
						withReplies: ps.withReplies,
					}, me);
				}
			} else {
				return await this.getFromDb({
					untilId,
					sinceId,
					limit: ps.limit,
					withFiles: ps.withFiles,
					withReplies: ps.withReplies,
				}, me);
			}
		});
	}

	private async getFromDb(ps: {
		sinceId: string | null,
		untilId: string | null,
		limit: number,
		withFiles: boolean,
		withReplies: boolean,
	}, me: MiLocalUser | null) {
		const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'),
			ps.sinceId, ps.untilId)
			.andWhere('(note.visibility = \'public\') AND (note.userHost IS NULL)')
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser');

		this.queryService.generateVisibilityQuery(query, me);
		if (me) this.queryService.generateMutedUserQuery(query, me);
		if (me) this.queryService.generateBlockedUserQuery(query, me);
		if (me) this.queryService.generateMutedUserRenotesQueryForNotes(query, me);

		if (ps.withFiles) {
			query.andWhere('note.fileIds != \'{}\'');
		}

		if (!ps.withReplies) {
			query.andWhere(new Brackets(qb => {
				qb
					.where('note.replyId IS NULL') // 返信ではない
					.orWhere(new Brackets(qb => {
						qb // 返信だけど投稿者自身への返信
							.where('note.replyId IS NOT NULL')
							.andWhere('note.replyUserId = note.userId');
					}));
			}));
		}

		const timeline = await query.limit(ps.limit).getMany();

		process.nextTick(() => {
			if (me) {
				this.activeUsersChart.read(me);
			}
		});

		return await this.noteEntityService.packMany(timeline, me);
	}
}
