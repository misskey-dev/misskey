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

		// TODO: いい感じにgetMulti内でソート済だからuniqするときにredisResultが全てソート済なのを利用して再ソートを避けたい
		const redisResultIds = Array.from(new Set(redisResult.flat(1))).sort(idCompare);

		let noteIds = redisResultIds.slice(0, ps.limit);
		const oldestNoteId = ascending ? redisResultIds[0] : redisResultIds[redisResultIds.length - 1];
		const shouldFallbackToDb = noteIds.length === 0 || ps.sinceId != null && ps.sinceId < oldestNoteId;

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

				// allowPartial のみ早期 return 許可。
				// それ以外は Redis 上位 limit 件範囲内の歯抜け検出が原理的に不可能なため
				// (Redis 内に存在しない歯抜け ID の有無を Redis データだけからは判別できない)、
				// 常に最終 dbFallback の全範囲取り直しに進ませて上位 limit 件を正しく再構築する。
				if (ps.allowPartial && redisTimeline.length !== 0) {
					return redisTimeline.slice(0, ps.limit);
				}
				if (redisTimeline.length >= ps.limit) {
					break;
				}
			}

			// 常に最終 dbFallback で全範囲を取り直し、Redis 由来と dedupe + sort + slice する。
			// Redis 最古/最新を境界に使うと、Redis 上の飛び石歯抜け
			// (3分ガード拒否, TTL evict, LREM 等) や、Redis ループでの古い ID 消費による
			// ページネーション境界のずれで取りこぼしが発生するため、ps.untilId/ps.sinceId の
			// 全範囲を引いて上位 limit 件を再構築する。
			// gotFromDb にも filter を適用するのは、Redis 経由のフィルタ (excludeReplies,
			// excludeNoFiles, ミュート/ブロック等) を DB 由来のノートにも揃えるため。
			const gotFromDb = await ps.dbFallback(ps.untilId, ps.sinceId, ps.limit);
			const seen = new Set(redisTimeline.map(n => n.id));
			const merged = [...redisTimeline, ...gotFromDb.filter(n => !seen.has(n.id) && filter(n))];
			merged.sort((a, b) => idCompare(a.id, b.id));
			return merged.slice(0, ps.limit);
		}

		return await ps.dbFallback(ps.untilId, ps.sinceId, ps.limit);
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
}
