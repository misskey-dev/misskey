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
import { DI } from '@/di-symbols.js';
import { CacheService } from '@/core/CacheService.js';
import { IdService } from '@/core/IdService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { QueryService } from '@/core/QueryService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['users', 'notes'],

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
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '27e494ba-2ac2-48e8-893b-10d4d8c2387b',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		withReplies: { type: 'boolean', default: false },
		withRenotes: { type: 'boolean', default: true },
		withChannelNotes: { type: 'boolean', default: false },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
		includeMyRenotes: { type: 'boolean', default: true },
		withFiles: { type: 'boolean', default: false },
		excludeNsfw: { type: 'boolean', default: false },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.redisForTimelines)
		private redisForTimelines: Redis.Redis,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private cacheService: CacheService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const [
				userIdsWhoMeMuting,
			] = me ? await Promise.all([
				this.cacheService.userMutingsCache.fetch(me.id),
			]) : [new Set<string>()];

			const limit = ps.limit + (ps.untilId ? 1 : 0) + (ps.sinceId ? 1 : 0); // untilIdに指定したものも含まれるため+1

			const [noteIdsRes, repliesNoteIdsRes, channelNoteIdsRes] = await Promise.all([
				this.redisForTimelines.xrevrange(
					ps.withFiles ? `userTimelineWithFiles:${ps.userId}` : `userTimeline:${ps.userId}`,
					ps.untilId ? this.idService.parse(ps.untilId).date.getTime() : ps.untilDate ?? '+',
					ps.sinceId ? this.idService.parse(ps.sinceId).date.getTime() : ps.sinceDate ?? '-',
					'COUNT', limit,
				).then(res => res.map(x => x[1][1]).filter(x => x !== ps.untilId && x !== ps.sinceId)),
				ps.withReplies
					? this.redisForTimelines.xrevrange(
						`userTimelineWithReplies:${ps.userId}`,
						ps.untilId ? this.idService.parse(ps.untilId).date.getTime() : ps.untilDate ?? '+',
						ps.sinceId ? this.idService.parse(ps.sinceId).date.getTime() : ps.sinceDate ?? '-',
						'COUNT', limit,
					).then(res => res.map(x => x[1][1]).filter(x => x !== ps.untilId && x !== ps.sinceId))
					: Promise.resolve([]),
				ps.withChannelNotes
					? this.redisForTimelines.xrevrange(
						`userTimelineWithChannel:${ps.userId}`,
						ps.untilId ? this.idService.parse(ps.untilId).date.getTime() : ps.untilDate ?? '+',
						ps.sinceId ? this.idService.parse(ps.sinceId).date.getTime() : ps.sinceDate ?? '-',
						'COUNT', limit,
					).then(res => res.map(x => x[1][1]).filter(x => x !== ps.untilId && x !== ps.sinceId))
					: Promise.resolve([]),
			]);

			let noteIds = Array.from(new Set([
				...noteIdsRes,
				...repliesNoteIdsRes,
				...channelNoteIdsRes,
			]));
			noteIds.sort((a, b) => a > b ? -1 : 1);
			noteIds = noteIds.slice(0, ps.limit);

			if (noteIds.length > 0) {
				const isFollowing = me ? Object.hasOwn(await this.cacheService.userFollowingsCache.fetch(me.id), ps.userId) : false;

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
					if (me && isUserRelated(note, userIdsWhoMeMuting, true)) return false;

					if (note.renoteId) {
						if (note.text == null && note.fileIds.length === 0 && !note.hasPoll) {
							if (ps.withRenotes === false) return false;
						}
					}

					if (note.visibility === 'followers' && !isFollowing) return false;

					return true;
				});

				timeline.sort((a, b) => a.id > b.id ? -1 : 1);

				return await this.noteEntityService.packMany(timeline, me);
			} else {
				// fallback to database

				//#region Construct query
				const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
					.andWhere('note.userId = :userId', { userId: ps.userId })
					.innerJoinAndSelect('note.user', 'user')
					.leftJoinAndSelect('note.reply', 'reply')
					.leftJoinAndSelect('note.renote', 'renote')
					.leftJoinAndSelect('note.channel', 'channel')
					.leftJoinAndSelect('reply.user', 'replyUser')
					.leftJoinAndSelect('renote.user', 'renoteUser');

				if (!ps.withChannelNotes) {
					query.andWhere('note.channelId IS NULL');
				}

				this.queryService.generateVisibilityQuery(query, me);

				if (ps.withFiles) {
					query.andWhere('note.fileIds != \'{}\'');
				}

				if (ps.includeMyRenotes === false) {
					query.andWhere(new Brackets(qb => {
						qb.orWhere('note.userId != :userId', { userId: ps.userId });
						qb.orWhere('note.renoteId IS NULL');
						qb.orWhere('note.text IS NOT NULL');
						qb.orWhere('note.fileIds != \'{}\'');
						qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
					}));
				}
				//#endregion

				const timeline = await query.limit(ps.limit).getMany();

				return await this.noteEntityService.packMany(timeline, me);
			}
		});
	}
}
