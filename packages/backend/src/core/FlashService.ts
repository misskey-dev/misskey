/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { type FlashsRepository } from '@/models/_.js';

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
	 * 人気のあるPlay一覧を取得する.
	 */
	public async featured(opts?: { offset?: number, limit: number }) {
		const builder = this.flashRepository.createQueryBuilder('flash')
			.andWhere('flash.likedCount > 0')
			.andWhere('flash.visibility = :visibility', { visibility: 'public' })
			.addOrderBy('flash.likedCount', 'DESC')
			.addOrderBy('flash.updatedAt', 'DESC')
			.addOrderBy('flash.id', 'DESC');

		if (opts?.offset) {
			builder.skip(opts.offset);
		}

		builder.take(opts?.limit ?? 10);

		return await builder.getMany();
	}
}
