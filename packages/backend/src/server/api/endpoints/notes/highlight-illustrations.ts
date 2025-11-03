/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { FeaturedService } from '@/core/FeaturedService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { CacheService } from '@/core/CacheService.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	allowGet: true,
	cacheSec: 1800, // 1時間キャッシュ

	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	private globalNotesRankingCache: string[] = [];
	private globalNotesRankingCacheLastFetchedAt = 0;

	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private cacheService: CacheService,
		private noteEntityService: NoteEntityService,
		private featuredService: FeaturedService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// FeaturedServiceからハイライトノートを取得
			let noteIds: string[];
			if (this.globalNotesRankingCacheLastFetchedAt !== 0 && (Date.now() - this.globalNotesRankingCacheLastFetchedAt < 1000 * 60 * 30)) {
				noteIds = this.globalNotesRankingCache;
			} else {
				noteIds = await this.featuredService.getGlobalNotesRanking(20);
				this.globalNotesRankingCache = noteIds;
				this.globalNotesRankingCacheLastFetchedAt = Date.now();
			}

			noteIds.sort((a, b) => a > b ? -1 : 1);
			if (ps.untilId) {
				noteIds = noteIds.filter(id => id < ps.untilId!);
			}
			noteIds = noteIds.slice(0, ps.limit);

			if (noteIds.length === 0) {
				return [];
			}

			const query = this.notesRepository.createQueryBuilder('note')
				.where('note.id IN (:...noteIds)', { noteIds: noteIds })
				.andWhere('note.visibility = \'public\'')
				.andWhere('note.fileIds != \'{}\'') // 画像ありのみ
				.andWhere('note.userHost IS NULL') // ローカルユーザーのみ
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser')
				.leftJoinAndSelect('note.channel', 'channel')
				// イラストハイライトから除外されているファイルを除外
				.leftJoin('drive_file', 'file', 'file.id = ANY(note."fileIds")')
				.andWhere('(file."excludedFromIllustrationHighlight" IS NULL OR file."excludedFromIllustrationHighlight" = false)');

			this.queryService.generateBlockedHostQueryForNote(query);
			this.queryService.generateSuspendedUserQueryForNote(query);

			const [
				userIdsWhoMeMuting,
				userIdsWhoBlockingMe,
			] = me ? await Promise.all([
				this.cacheService.userMutingsCache.fetch(me.id),
				this.cacheService.userBlockedCache.fetch(me.id),
			]) : [new Set<string>(), new Set<string>()];

			const notes = (await query.getMany()).filter(note => {
				if (note.text == null && note.fileIds.length === 0) return false;
				if (me && isUserRelated(note, userIdsWhoBlockingMe)) return false;
				if (me && isUserRelated(note, userIdsWhoMeMuting)) return false;
				return true;
			});

			notes.sort((a, b) => a.id > b.id ? -1 : 1);

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
