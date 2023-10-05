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
import { ApiError } from '../../error.js';

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

		private noteEntityService: NoteEntityService,
		private roleService: RoleService,
		private activeUsersChart: ActiveUsersChart,
		private idService: IdService,
		private cacheService: CacheService,
	) {
		super(meta, paramDef, async (ps, me) => {
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

			let timeline: MiNote[] = [];

			const limit = ps.limit + (ps.untilId ? 1 : 0) + (ps.sinceId ? 1 : 0); // untilIdに指定したものも含まれるため+1
			let htlNoteIdsRes: [string, string[]][] = [];
			let ltlNoteIdsRes: [string, string[]][] = [];

			if (!ps.sinceId && !ps.sinceDate) {
				[htlNoteIdsRes, ltlNoteIdsRes] = await Promise.all([
					this.redisForTimelines.xrevrange(
						ps.withFiles ? `homeTimelineWithFiles:${me.id}` : `homeTimeline:${me.id}`,
						ps.untilId ? this.idService.parse(ps.untilId).date.getTime() : ps.untilDate ?? '+',
						ps.sinceId ? this.idService.parse(ps.sinceId).date.getTime() : ps.sinceDate ?? '-',
						'COUNT', limit),
					this.redisForTimelines.xrevrange(
						ps.withFiles ? 'localTimelineWithFiles' : 'localTimeline',
						ps.untilId ? this.idService.parse(ps.untilId).date.getTime() : ps.untilDate ?? '+',
						ps.sinceId ? this.idService.parse(ps.sinceId).date.getTime() : ps.sinceDate ?? '-',
						'COUNT', limit),
				]);
			}

			const htlNoteIds = htlNoteIdsRes.map(x => x[1][1]).filter(x => x !== ps.untilId && x !== ps.sinceId);
			const ltlNoteIds = ltlNoteIdsRes.map(x => x[1][1]).filter(x => x !== ps.untilId && x !== ps.sinceId);
			let noteIds = Array.from(new Set([...htlNoteIds, ...ltlNoteIds]));
			noteIds.sort((a, b) => a > b ? -1 : 1);
			noteIds = noteIds.slice(0, ps.limit);

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
