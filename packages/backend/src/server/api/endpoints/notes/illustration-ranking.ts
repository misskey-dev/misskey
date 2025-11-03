/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { CacheService } from '@/core/CacheService.js';
import { QueryService } from '@/core/QueryService.js';
import { genAid } from '@/misc/id/aid.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	kind: 'read:account',
	allowGet: true,
	cacheSec: 60,

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
		offset: { type: 'integer', minimum: 0, default: 0 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private cacheService: CacheService,
		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			/**
			 * イラストランキング仕様:
			 * - リアクション数が大きい順にソート
			 * - 直近3ヶ月以内に投稿されたイラストのみ
			 * - 画像ファイルが添付されている投稿のみ（タグは不問）
			 */

			// 3ヶ月前のIDを計算（MisskeyのIDは時系列順）
			const threeMonthsAgo = new Date();
			threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
			const threeMonthsAgoId = genAid(threeMonthsAgo.getTime());

			// クエリ構築
			const query = this.notesRepository.createQueryBuilder('note')
				.where('note.fileIds != \'{}\'') // 画像ありのみ
				.andWhere('note.channelId IS NULL') // チャンネル投稿ではない
				.andWhere('note.visibility = \'public\'') // Public投稿のみ
				.andWhere('note.id > :threeMonthsAgoId', { threeMonthsAgoId }); // 3ヶ月以内

			query.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser')
				.leftJoinAndSelect('note.channel', 'channel');

			this.queryService.generateBlockedHostQueryForNote(query);
			this.queryService.generateSuspendedUserQueryForNote(query);

			// リアクション数でソート（降順）
			// PostgreSQLのjsonb_array_length関数を使用してreactionsの長さを計算
			query.addSelect(
				`COALESCE(
					(SELECT COUNT(*) FROM jsonb_object_keys(note.reactions)),
					0
				)`,
				'reaction_count',
			)
				.orderBy('reaction_count', 'DESC')
				.addOrderBy('note.id', 'DESC') // リアクション数が同じ場合は新しい順
				.offset(ps.offset)
				.limit(ps.limit);

			// ミュート・ブロックフィルタ
			const [
				userIdsWhoMeMuting,
				userIdsWhoBlockingMe,
			] = me ? await Promise.all([
				this.cacheService.userMutingsCache.fetch(me.id),
				this.cacheService.userBlockedCache.fetch(me.id),
			]) : [new Set<string>(), new Set<string>()];

			const rawNotes = await query.getMany();

			const notes = rawNotes.filter(note => {
				if (note.text == null && note.fileIds.length === 0) return false;
				if (me && isUserRelated(note, userIdsWhoBlockingMe)) return false;
				if (me && isUserRelated(note, userIdsWhoMeMuting)) return false;
				return true;
			});

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
