/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NotesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { MetaService } from '@/core/MetaService.js';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 3600, // 1時間キャッシュ

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				tag: {
					type: 'string',
					optional: false, nullable: false,
				},
				count: {
					type: 'integer',
					optional: false, nullable: false,
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private metaService: MetaService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// 管理画面の非表示ハッシュタグを取得
			const instance = await this.metaService.fetch();
			const hiddenTags = instance.hiddenTags.map(tag => tag.toLowerCase());

			// note.tagsフィールドから画像付き投稿が多いハッシュタグを集計
			const query = this.notesRepository.createQueryBuilder('note')
				.select('UNNEST(note.tags)', 'tag')
				.addSelect('COUNT(*)', 'count')
				.where('note.fileIds != \'{}\'') // 画像ありのみ
				.andWhere('note.visibility = \'public\'') // Public投稿のみ
				.andWhere('note.channelId IS NULL')
				.andWhere('note.tags != \'{}\'') // タグが存在するもののみ
				.andWhere('note.userHost IS NULL') // ローカルユーザーのみ
				// イラストハイライトから除外されているファイルを除外
				.leftJoin('drive_file', 'file', 'file.id = ANY(note."fileIds")')
				.andWhere('(file."excludedFromIllustrationHighlight" IS NULL OR file."excludedFromIllustrationHighlight" = false)')
				.groupBy('tag')
				.orderBy('count', 'DESC')
				.limit(ps.limit * 2); // 非表示タグでフィルタリングするため、多めに取得

			const result = await query.getRawMany();

			// タグ名を小文字化して重複を排除し、カウントを合計
			const tagMap = new Map<string, number>();
			for (const row of result) {
				const tag = row.tag as string;
				const count = parseInt(row.count as string, 10);
				const lowerTag = tag.toLowerCase();

				// 非表示タグに含まれている場合はスキップ
				if (hiddenTags.includes(lowerTag)) {
					continue;
				}

				tagMap.set(lowerTag, (tagMap.get(lowerTag) || 0) + count);
			}

			// Map を配列に変換してソート
			const tags = Array.from(tagMap.entries())
				.map(([tag, count]) => ({ tag, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, ps.limit);

			return tags;
		});
	}
}
