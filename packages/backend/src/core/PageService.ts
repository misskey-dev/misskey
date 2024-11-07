/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { type PagesRepository } from '@/models/_.js';

/**
 * ページ関係のService
 */
@Injectable()
export class PageService {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,
	) {
	}

	/**
	 * 人気のあるページ一覧を取得する.
	 */
	public async featured(opts?: { offset?: number, limit: number }) {
		const builder = this.pagesRepository.createQueryBuilder('page')
			.andWhere('page.likedCount > 0')
			.andWhere('page.visibility = :visibility', { visibility: 'public' })
			.addOrderBy('page.likedCount', 'DESC')
			.addOrderBy('page.updatedAt', 'DESC')
			.addOrderBy('page.id', 'DESC');

		if (opts?.offset) {
			builder.skip(opts.offset);
		}

		builder.take(opts?.limit ?? 10);

		return await builder.getMany();
	}
}
