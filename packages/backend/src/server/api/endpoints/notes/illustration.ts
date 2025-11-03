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
		untilId: { type: 'string', format: 'misskey:id' },
		sinceId: { type: 'string', format: 'misskey:id' },
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
			// 画像付き投稿を検索（ハッシュタグフィルタなし）
			const query = this.notesRepository.createQueryBuilder('note')
				.where('note.fileIds != \'{}\'') // 画像ありのみ
				.andWhere('note.channelId IS NULL') // チャンネル投稿ではない
				.andWhere('note.visibility = \'public\''); // Public投稿のみ

			if (ps.sinceId) {
				query.andWhere('note.id > :sinceId', { sinceId: ps.sinceId });
			}

			if (ps.untilId) {
				query.andWhere('note.id < :untilId', { untilId: ps.untilId });
			}

			query.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser')
				.leftJoinAndSelect('note.channel', 'channel')
				// イラストハイライトから除外されているファイルを除外
				.leftJoin('drive_file', 'file', 'file.id = ANY(note."fileIds")')
				.andWhere('(file."excludedFromIllustrationHighlight" IS NULL OR file."excludedFromIllustrationHighlight" = false)')
				.orderBy('note.id', 'DESC')
				.limit(ps.limit);

			this.queryService.generateBlockedHostQueryForNote(query);
			this.queryService.generateSuspendedUserQueryForNote(query);

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
