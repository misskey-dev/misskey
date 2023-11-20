/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { ChannelsRepository, MiNote, NotesRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { FunoutTimelineService } from '@/core/FunoutTimelineService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { CacheService } from '@/core/CacheService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes', 'channels'],

	requireCredential: false,

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
		noSuchChannel: {
			message: 'No such channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '4d0eeeba-a02c-4c3c-9966-ef60d38d2e7f',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		channelId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
	},
	required: ['channelId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.redisForTimelines)
		private redisForTimelines: Redis.Redis,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		private idService: IdService,
		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private funoutTimelineService: FunoutTimelineService,
		private cacheService: CacheService,
		private activeUsersChart: ActiveUsersChart,
	) {
		super(meta, paramDef, async (ps, me) => {
			const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : null);
			const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : null);
			const isRangeSpecified = untilId != null && sinceId != null;

			const channel = await this.channelsRepository.findOneBy({
				id: ps.channelId,
			});

			if (channel == null) {
				throw new ApiError(meta.errors.noSuchChannel);
			}

			if (me) this.activeUsersChart.read(me);

			if (isRangeSpecified || sinceId == null) {
				const [
					userIdsWhoMeMuting,
				] = me ? await Promise.all([
					this.cacheService.userMutingsCache.fetch(me.id),
				]) : [new Set<string>()];

				let noteIds = await this.funoutTimelineService.get(`channelTimeline:${channel.id}`, untilId, sinceId);
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
						if (me && isUserRelated(note, userIdsWhoMeMuting)) return false;

						return true;
					});

					// TODO: フィルタで件数が減った場合の埋め合わせ処理

					timeline.sort((a, b) => a.id > b.id ? -1 : 1);

					if (timeline.length > 0) {
						return await this.noteEntityService.packMany(timeline, me);
					}
				}
			}

			//#region fallback to database
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('note.channelId = :channelId', { channelId: channel.id })
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser')
				.leftJoinAndSelect('note.channel', 'channel');

			if (me) {
				this.queryService.generateMutedUserQuery(query, me);
				this.queryService.generateBlockedUserQuery(query, me);
			}
			//#endregion

			const timeline = await query.limit(ps.limit).getMany();

			return await this.noteEntityService.packMany(timeline, me);
			//#endregion
		});
	}
}
