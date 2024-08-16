/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { FlashVisibility } from '@/models/Flash.js';
import { DI } from '@/di-symbols.js';
import { type FlashsRepository } from '@/models/_.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';

export const playSortKeys = [
	'+id',
	'-id',
	'+updatedAt',
	'-updatedAt',
	'+userId',
	'-userId',
	'+title',
	'-title',
	'+visibility',
	'-visibility',
	'+likedCount',
	'-likedCount',
] as const;

export type PlaySortKey = typeof playSortKeys[number]

/**
 * MisskeyPlay関係のService
 */
@Injectable()
export class FlashService {
	constructor(
		@Inject(DI.flashsRepository)
		private flashRepository: FlashsRepository,
	) {
	}

	/**
	 * 登録されているPlayを検索する.
	 * 1つの検索項目に複数の値が指定された場合は、それらの値をOR条件で検索する.
	 * 複数の検索項目に条件が指定された場合は、それらの条件をAND条件で検索する.
	 *
	 * @param params
	 * @param params.query
	 * @param {string | undefined} [params.query.updatedAtFrom] 更新日時の範囲指定の開始日時
	 * @param {string | undefined} [params.query.updatedAtTo] 更新日時の範囲指定の終了日時
	 * @param {string[] | undefined} [params.query.titleKeyWords] タイトルに含まれるキーワード
	 * @param {string[] | undefined} [params.query.summaryKeyWords] 概要に含まれるキーワード
	 * @param {string[] | undefined} [params.query.userIds] 作者ユーザーID
	 * @param {number | undefined} [params.query.likedCountMin] いいね数の最小値
	 * @param {number | undefined} [params.query.likedCountMax] いいね数の最大値
	 * @param {FlashVisibility | undefined} [params.query.visibility] 公開範囲
	 * @param opts
	 * @param {number | undefined} [opts.limit] 取得する件数
	 * @param {number | undefined} [opts.page] ページ番号
	 * @param {PlaySortKey[] | undefined} [opts.sortKeys] ソートキー
	 */
	public async search(
		params?: {
			query?: {
				updatedAtFrom?: string;
				updatedAtTo?: string;
				titleKeyWords?: string[];
				summaryKeyWords?: string[];
				userIds?: string[];
				likedCountMin?: number;
				likedCountMax?: number;
				visibility?: FlashVisibility;
			},
			sinceId?: string;
			untilId?: string;
		},
		opts? :{
			limit?: number;
			page?: number;
			sortKeys?: PlaySortKey[];
		},
	) {
		const builder = this.flashRepository.createQueryBuilder('flash');

		const q = params?.query;
		if (q) {
			if (q.updatedAtFrom) {
				builder.andWhere('CAST(flash.updatedAt AS DATE) >= :updateAtFrom', { updateAtFrom: q.updatedAtFrom });
			}

			if (q.updatedAtTo) {
				builder.andWhere('CAST(flash.updatedAt AS DATE) <= :updateAtTo', { updateAtTo: q.updatedAtTo });
			}

			if (q.titleKeyWords && q.titleKeyWords.length > 0) {
				builder.andWhere('flash.title LIKE ANY(ARRAY[:...titleKeyWords])', {
					titleKeyWords: q.titleKeyWords.map(x => '%' + sqlLikeEscape(x) + '%'),
				});
			}

			if (q.summaryKeyWords && q.summaryKeyWords.length > 0) {
				builder.andWhere('flash.summary LIKE ANY(ARRAY[:...summaryKeyWords])', {
					summaryKeyWords: q.summaryKeyWords.map(x => '%' + sqlLikeEscape(x) + '%'),
				});
			}

			if (q.userIds && q.userIds.length > 0) {
				builder.andWhere('flash.userId IN (:...userIds)', { userIds: q.userIds });
			}

			if (q.likedCountMin) {
				builder.andWhere('flash.likedCount >= :likedCountMin', { likedCountMin: q.likedCountMin });
			}

			if (q.likedCountMax) {
				builder.andWhere('flash.likedCount <= :likedCountMax', { likedCountMax: q.likedCountMax });
			}

			if (q.visibility) {
				builder.andWhere('flash.visibility = :visibility', { visibility: q.visibility });
			}
		}

		if (params?.sinceId) {
			builder.andWhere('flash.id > :sinceId', { sinceId: params.sinceId });
		}

		if (params?.untilId) {
			builder.andWhere('flash.id < :untilId', { untilId: params.untilId });
		}

		if (opts?.sortKeys && opts.sortKeys.length > 0) {
			for (const sortKey of opts.sortKeys) {
				const direction = sortKey.startsWith('-') ? 'DESC' : 'ASC';
				const key = sortKey.replace(/^[+-]/, '');
				builder.addOrderBy(`flash.${key}`, direction);
			}
		} else {
			builder.addOrderBy('flash.id', 'DESC');
		}

		const limit = opts?.limit ?? 10;
		if (opts?.page) {
			builder.skip((opts.page - 1) * limit);
		}

		builder.take(limit);

		const [items, count] = await builder.getManyAndCount();
		return {
			items: items,
			page: opts?.page ?? 1,
			allPages: Math.ceil(count / limit),
			count: (count > limit ? items.length : count),
			allCount: count,
		};
	}
}
