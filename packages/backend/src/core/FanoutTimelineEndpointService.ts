/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import type { MiUser } from '@/models/User.js';
import type { MiNote } from '@/models/Note.js';
import { Packed } from '@/misc/json-schema.js';
import type { NotesRepository } from '@/models/_.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { FanoutTimelineService } from '@/core/FanoutTimelineService.js';
import { MetaService } from '@/core/MetaService.js';

@Injectable()
export class FanoutTimelineEndpointService {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private fanoutTimelineService: FanoutTimelineService,
		private metaService: MetaService,
	) {
	}

	@bindThis
	async timeline(ps: {
		untilId: string | null,
		sinceId: string | null,
		limit: number,
		me?: { id: MiUser['id'] } | undefined | null,
		redisTimelines: (string | { name: string, fallbackIfEmpty: boolean })[],
		noteFilter: (note: MiNote) => boolean,
		dbFallback: (untilId: string | null, sinceId: string | null, limit: number) => Promise<MiNote[]>,
	}): Promise<Packed<'Note'>[]> {
		let noteIds: string[];
		let shouldFallbackToDb = false;

		const timelines = ps.redisTimelines.map(x => typeof x === 'string' ? x : x.name);

		const redisResult = await this.fanoutTimelineService.getMulti(timelines, ps.untilId, ps.sinceId);

		for (let i = 0; i < ps.redisTimelines.length; i++) {
			const sourceRedisConfig = ps.redisTimelines[i];
			if (typeof sourceRedisConfig === 'object' && sourceRedisConfig.fallbackIfEmpty) {
				if (redisResult[i].length === 0) {
					shouldFallbackToDb = true;
				}
			}
		}

		noteIds = Array.from(new Set(redisResult.flat(1)));

		noteIds.sort((a, b) => a > b ? -1 : 1);
		noteIds = noteIds.slice(0, ps.limit);

		shouldFallbackToDb = shouldFallbackToDb || (noteIds.length === 0);

		let redisTimeline: MiNote[] = [];

		if (!shouldFallbackToDb) {
			const query = this.notesRepository.createQueryBuilder('note')
				.where('note.id IN (:...noteIds)', { noteIds: noteIds })
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser')
				.leftJoinAndSelect('note.channel', 'channel');

			redisTimeline = await query.getMany();

			redisTimeline = redisTimeline.filter(ps.noteFilter);

			redisTimeline.sort((a, b) => a.id > b.id ? -1 : 1);

			// TODO: 足りない分の埋め合わせ
			if (redisTimeline.length !== 0) {
				return await this.noteEntityService.packMany(redisTimeline, ps.me);
			}
		}

		if ((await this.metaService.fetch()).enableFanoutTimelineDbFallback) { // fallback to db
			const timeline = await ps.dbFallback(ps.untilId, ps.sinceId, ps.limit);

			return await this.noteEntityService.packMany(timeline, ps.me);
		} else {
			return [];
		}
	}
}
