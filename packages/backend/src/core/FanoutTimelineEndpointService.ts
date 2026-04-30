/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import type { MiUser } from '@/models/User.js';
import type { MiNote } from '@/models/Note.js';
import type { MiMeta } from '@/models/Meta.js';
import { Packed } from '@/misc/json-schema.js';
import type { NotesRepository } from '@/models/_.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { FanoutTimelineName, FanoutTimelineService } from '@/core/FanoutTimelineService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { IdService } from '@/core/IdService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { isQuote, isRenote } from '@/misc/is-renote.js';
import { CacheService } from '@/core/CacheService.js';
import { isReply } from '@/misc/is-reply.js';
import { isInstanceMuted } from '@/misc/is-instance-muted.js';
import { ChannelMutingService } from '@/core/ChannelMutingService.js';
import { isChannelRelated } from '@/misc/is-channel-related.js';

type NoteFilter = (note: MiNote) => boolean;

type TimelineOptions = {
	untilId: string | null,
	sinceId: string | null,
	limit: number,
	allowPartial: boolean,
	me?: { id: MiUser['id'] } | undefined | null,
	useDbFallback: boolean,
	redisTimelines: FanoutTimelineName[],
	noteFilter?: NoteFilter,
	alwaysIncludeMyNotes?: boolean;
	ignoreAuthorFromBlock?: boolean;
	ignoreAuthorFromMute?: boolean;
	ignoreAuthorFromInstanceBlock?: boolean;
	ignoreAuthorChannelFromMute?: boolean;
	excludeNoFiles?: boolean;
	excludeReplies?: boolean;
	excludePureRenotes: boolean;
	ignoreAuthorFromUserSuspension?: boolean;
	dbFallback: (untilId: string | null, sinceId: string | null, limit: number) => Promise<MiNote[]>,
};

@Injectable()
export class FanoutTimelineEndpointService {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.meta)
		private meta: MiMeta,

		private noteEntityService: NoteEntityService,
		private cacheService: CacheService,
		private fanoutTimelineService: FanoutTimelineService,
		private utilityService: UtilityService,
		private channelMutingService: ChannelMutingService,
		private idService: IdService,
	) {
	}

	@bindThis
	async timeline(ps: TimelineOptions): Promise<Packed<'Note'>[]> {
		return await this.noteEntityService.packMany(await this.getMiNotes(ps), ps.me);
	}

	@bindThis
	async getMiNotes(ps: TimelineOptions): Promise<MiNote[]> {
		// 呼び出し元と以下の処理をシンプルにするためにdbFallbackを置き換える
		if (!ps.useDbFallback) ps.dbFallback = () => Promise.resolve([]);

		const ascending = ps.sinceId && !ps.untilId;
		const idCompare: (a: string, b: string) => number = ascending ? (a, b) => a < b ? -1 : 1 : (a, b) => a > b ? -1 : 1;

		const redisResult = await this.fanoutTimelineService.getMulti(ps.redisTimelines, ps.untilId, ps.sinceId);

		// 取得したredisResultのうち、2つ以上ソースがあり、1つでも空であればDBにフォールバックする
		const trustedEmptyIndices = new Set<number>();
		for (let i = 0; i < redisResult.length; i++) {
			const ids = redisResult[i];
			const dummyIdIndex = ids.findIndex(id => this.idService.parse(id).date.getTime() === 1);
			if (dummyIdIndex !== -1) {
				ids.splice(dummyIdIndex, 1);
				if (ids.length === 0) {
					trustedEmptyIndices.add(i);
				}
			}
		}

		let shouldFallbackToDb = ps.useDbFallback && (redisResult.length > 1 && redisResult.some((ids, i) => ids.length === 0 && !trustedEmptyIndices.has(i)));

		// 取得したresultの中で最古のIDのうち、最も新しいものを取得
		// ids自体が空配列の場合、ids[ids.length - 1]はundefinedになるため、filterでnullを除外する
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		const fttThresholdId = redisResult.map(ids => ascending ? ids[0] : ids[ids.length - 1]).filter(id => id != null).sort().pop();

		// TODO: いい感じにgetMulti内でソート済だからuniqするときにredisResultが全てソート済なのを利用して再ソートを避けたい
		let redisResultIds = shouldFallbackToDb ? [] : Array.from(new Set(redisResult.flat(1)));
		if (ps.useDbFallback && fttThresholdId != null) {
			redisResultIds = redisResultIds.filter(id => id >= fttThresholdId);
		}
		redisResultIds.sort(idCompare);

		let noteIds = redisResultIds.slice(0, ps.limit);

		const oldestNoteId = ascending ? redisResultIds[0] : redisResultIds[redisResultIds.length - 1];
		shouldFallbackToDb ||= ps.useDbFallback && (noteIds.length === 0 || ps.sinceId != null && ps.sinceId < oldestNoteId);

		if (!shouldFallbackToDb) {
			let filter = ps.noteFilter ?? (_note => true) as NoteFilter;

			if (ps.alwaysIncludeMyNotes && ps.me) {
				const me = ps.me;
				const parentFilter = filter;
				filter = (note) => note.userId === me.id || parentFilter(note);
			}

			if (ps.excludeNoFiles) {
				const parentFilter = filter;
				filter = (note) => note.fileIds.length !== 0 && parentFilter(note);
			}

			if (ps.excludeReplies) {
				const parentFilter = filter;
				filter = (note) => !isReply(note, ps.me?.id) && parentFilter(note);
			}

			if (ps.excludePureRenotes) {
				const parentFilter = filter;
				filter = (note) => (!isRenote(note) || isQuote(note)) && parentFilter(note);
			}

			if (ps.me) {
				const me = ps.me;
				const [
					userIdsWhoMeMuting,
					userIdsWhoMeMutingRenotes,
					userIdsWhoBlockingMe,
					userMutedInstances,
					userMutedChannels,
				] = await Promise.all([
					this.cacheService.userMutingsCache.fetch(ps.me.id),
					this.cacheService.renoteMutingsCache.fetch(ps.me.id),
					this.cacheService.userBlockedCache.fetch(ps.me.id),
					this.cacheService.userProfileCache.fetch(me.id).then(p => new Set(p.mutedInstances)),
					this.channelMutingService.mutingChannelsCache.fetch(me.id),
				]);

				const parentFilter = filter;
				filter = (note) => {
					if (isUserRelated(note, userIdsWhoBlockingMe, ps.ignoreAuthorFromBlock)) return false;
					if (isUserRelated(note, userIdsWhoMeMuting, ps.ignoreAuthorFromMute)) return false;
					if (isUserRelated(note.renote, userIdsWhoBlockingMe, ps.ignoreAuthorFromBlock)) return false;
					if (isUserRelated(note.renote, userIdsWhoMeMuting, ps.ignoreAuthorFromMute)) return false;
					if (!ps.ignoreAuthorFromMute && isRenote(note) && !isQuote(note) && userIdsWhoMeMutingRenotes.has(note.userId)) return false;
					if (isInstanceMuted(note, userMutedInstances)) return false;
					if (isChannelRelated(note, userMutedChannels, ps.ignoreAuthorChannelFromMute)) return false;

					return parentFilter(note);
				};
			}

			{
				const parentFilter = filter;
				filter = (note) => {
					if (!ps.ignoreAuthorFromInstanceBlock) {
						if (this.utilityService.isBlockedHost(this.meta.blockedHosts, note.userHost)) return false;
					}
					if (note.userId !== note.renoteUserId && this.utilityService.isBlockedHost(this.meta.blockedHosts, note.renoteUserHost)) return false;
					if (note.userId !== note.replyUserId && this.utilityService.isBlockedHost(this.meta.blockedHosts, note.replyUserHost)) return false;

					return parentFilter(note);
				};
			}

			{
				const parentFilter = filter;
				filter = (note) => {
					if (!ps.ignoreAuthorFromUserSuspension) {
						if (note.user!.isSuspended) return false;
					}
					if (note.userId !== note.renoteUserId && note.renote?.user?.isSuspended) return false;
					if (note.userId !== note.replyUserId && note.reply?.user?.isSuspended) return false;

					return parentFilter(note);
				};
			}

			const redisTimeline: MiNote[] = [];
			let readFromRedis = 0;
			let lastSuccessfulRate = 1; // rateをキャッシュする？

			while ((redisResultIds.length - readFromRedis) !== 0) {
				const remainingToRead = ps.limit - redisTimeline.length;

				// DBからの取り直しを減らす初回と同じ割合以上で成功すると仮定するが、クエリの長さを考えて三倍まで
				const countToGet = Math.ceil(remainingToRead * Math.min(1.1 / lastSuccessfulRate, 3));
				noteIds = redisResultIds.slice(readFromRedis, readFromRedis + countToGet);

				readFromRedis += noteIds.length;

				const gotFromDb = await this.getAndFilterFromDb(noteIds, filter, idCompare);
				redisTimeline.push(...gotFromDb);
				lastSuccessfulRate = gotFromDb.length / noteIds.length;

				if (ps.allowPartial ? redisTimeline.length !== 0 : redisTimeline.length >= ps.limit) {
					// 十分Redisからとれた
					return redisTimeline.slice(0, ps.limit);
				}
			}

			// まだ足りない分はDBにフォールバック
			const remainingToRead = ps.limit - redisTimeline.length;
			let dbUntil: string | null;
			let dbSince: string | null;
			if (ascending) {
				dbUntil = ps.untilId;
				dbSince = noteIds[noteIds.length - 1];
			} else {
				dbUntil = noteIds[noteIds.length - 1];
				dbSince = ps.sinceId;
			}
			const gotFromDb = await ps.dbFallback(dbUntil, dbSince, remainingToRead);
			return [...redisTimeline, ...gotFromDb];
		}

		// RedisおよびDBが空の場合、次回以降の無駄なDBアクセスを防ぐためダミーIDを保存する
		const gotFromDb = await ps.dbFallback(ps.untilId, ps.sinceId, ps.limit);
		const canInject = (
			(redisResultIds.length === 0 && ps.sinceId == null && ps.untilId == null) &&
			(gotFromDb.length < ps.limit)
		);

		if (canInject) {
			const dummyId = this.idService.gen(1); // 1 = Detectable Dummy Timestamp

			Promise.all(ps.redisTimelines.map((tl, i) => {
				// 有効なソースかつ結果が空だった場合のみダミーを入れる
				if (redisResult[i] && redisResult[i].length === 0) {
					let isEmpty = true;
					if (gotFromDb.length > 0) {
						isEmpty = !gotFromDb.some(n => this.accepts(tl, n));
					}

					if (isEmpty) {
						return this.fanoutTimelineService.injectDummyIfEmpty(tl, dummyId);
					}
				}
				return Promise.resolve();
			}));
		}

		return gotFromDb;
	}

	private async getAndFilterFromDb(noteIds: string[], noteFilter: NoteFilter, idCompare: (a: string, b: string) => number): Promise<MiNote[]> {
		const query = this.notesRepository.createQueryBuilder('note')
			.where('note.id IN (:...noteIds)', { noteIds: noteIds })
			.innerJoinAndSelect('note.user', 'user')
			.leftJoinAndSelect('note.reply', 'reply')
			.leftJoinAndSelect('note.renote', 'renote')
			.leftJoinAndSelect('reply.user', 'replyUser')
			.leftJoinAndSelect('renote.user', 'renoteUser')
			.leftJoinAndSelect('note.channel', 'channel');

		const notes = (await query.getMany()).filter(noteFilter);

		notes.sort((a, b) => idCompare(a.id, b.id));

		return notes;
	}

	private accepts(tl: FanoutTimelineName, note: MiNote): boolean {
		if (tl === 'localTimeline') {
			return !note.userHost && !note.replyId && note.visibility === 'public';
		} else if (tl === 'localTimelineWithFiles') {
			return !note.userHost && !note.replyId && note.visibility === 'public' && note.fileIds.length > 0;
		} else if (tl === 'localTimelineWithReplies') {
			return !note.userHost && note.replyId != null && note.visibility === 'public';
		} else if (tl.startsWith('localTimelineWithReplyTo:')) {
			const id = tl.split(':')[1];
			return !note.userHost && note.replyId != null && note.replyUserId === id;
		} else if (tl.startsWith('userTimeline:')) {
			const id = tl.split(':')[1];
			return note.userId === id && !note.replyId;
		} else if (tl.startsWith('userTimelineWithFiles:')) {
			const id = tl.split(':')[1];
			return note.userId === id && !note.replyId && note.fileIds.length > 0;
		} else if (tl.startsWith('userTimelineWithReplies:')) {
			const id = tl.split(':')[1];
			return note.userId === id && note.replyId != null;
		} else if (tl.startsWith('userTimelineWithChannel:')) {
			const id = tl.split(':')[1];
			return note.userId === id && note.channelId != null;
		} else {
			// TODO: homeTimeline系
			return true;
		}
	}
}
