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

@Injectable()
export class FanoutTimelineEndpointService {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private fanoutTimelineService: FanoutTimelineService,
	) {
	}

	@bindThis
	async timeline(ps: {
		untilId: string | null,
		sinceId: string | null,
		limit: number,
		allowPartial: boolean,
		me?: { id: MiUser['id'] } | undefined | null,
		useDbFallback: boolean,
		redisTimelines: string[],
		noteFilter: (note: MiNote) => boolean,
		dbFallback: (untilId: string | null, sinceId: string | null, limit: number) => Promise<MiNote[]>,
	}): Promise<Packed<'Note'>[]> {
		return await this.noteEntityService.packMany(await this.getMiNotes(ps), ps.me);
	}

	@bindThis
	private async getMiNotes(ps: {
		untilId: string | null,
		sinceId: string | null,
		limit: number,
		allowPartial: boolean,
		me?: { id: MiUser['id'] } | undefined | null,
		useDbFallback: boolean,
		redisTimelines: string[],
		noteFilter: (note: MiNote) => boolean,
		dbFallback: (untilId: string | null, sinceId: string | null, limit: number) => Promise<MiNote[]>,
	}): Promise<MiNote[]> {
		let noteIds: string[];
		let shouldFallbackToDb = false;

		// 呼び出し元と以下の処理をシンプルにするためにdbFallbackを置き換える
		if (!ps.useDbFallback) ps.dbFallback = () => Promise.resolve([]);

		const redisResult = await this.fanoutTimelineService.getMulti(ps.redisTimelines, ps.untilId, ps.sinceId);

		const redisResultIds = Array.from(new Set(redisResult.flat(1)));

		redisResultIds.sort((a, b) => a > b ? -1 : 1);
		noteIds = redisResultIds.slice(0, ps.limit);

		shouldFallbackToDb = shouldFallbackToDb || (noteIds.length === 0);

		if (!shouldFallbackToDb) {
			const redisTimeline: MiNote[] = [];
			let readFromRedis = 0;
			let lastSuccessfulRate = 1; // rateをキャッシュする？
			let trialCount = 1;

			while ((redisResultIds.length - readFromRedis) !== 0) {
				const remainingToRead = ps.limit - redisTimeline.length;

				// DBからの取り直しを減らす初回と同じ割合以上で成功すると仮定するが、クエリの長さを考えて三倍まで
				const countToGet = remainingToRead * Math.ceil(Math.min(1.1 / lastSuccessfulRate, 3));
				noteIds = redisResultIds.slice(readFromRedis, readFromRedis + countToGet);

				readFromRedis += noteIds.length;

				const gotFromDb = await this.getAndFilterFromDb(noteIds, ps.noteFilter);
				redisTimeline.push(...gotFromDb);
				lastSuccessfulRate = gotFromDb.length / noteIds.length;

				console.log(`fanoutTimelineTrial#${trialCount++}: req: ${ps.limit}, tried: ${noteIds.length}, got: ${gotFromDb.length}, rate: ${lastSuccessfulRate}, total: ${redisTimeline.length}, fromRedis: ${redisResultIds.length}`);

				if (ps.allowPartial ? redisTimeline.length !== 0 : redisTimeline.length >= ps.limit) {
					// 十分Redisからとれた
					return redisTimeline.slice(0, ps.limit);
				}
			}

			// まだ足りない分はDBにフォールバック
			const remainingToRead = ps.limit - redisTimeline.length;
			const gotFromDb = await ps.dbFallback(noteIds[noteIds.length - 1], ps.sinceId, remainingToRead);
			redisTimeline.push(...gotFromDb);
			console.log(`fanoutTimelineTrial#db: req: ${ps.limit}, tried: ${remainingToRead}, got: ${gotFromDb.length}, since: ${noteIds[noteIds.length - 1]}, until: ${ps.untilId}, total: ${redisTimeline.length}`);
			return redisTimeline;
		}

		return await ps.dbFallback(ps.untilId, ps.sinceId, ps.limit);
	}

	private async getAndFilterFromDb(noteIds: string[], noteFilter: (note: MiNote) => boolean): Promise<MiNote[]> {
		const query = this.notesRepository.createQueryBuilder('note')
			.where('note.id IN (:...noteIds)', { noteIds: noteIds })
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser')
			.leftJoinAndSelect('note.channel', 'channel');

		const notes = (await query.getMany()).filter(noteFilter);

		notes.sort((a, b) => a.id > b.id ? -1 : 1);

		return notes;
	}
}
