/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { SigninsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { SigninEntityService } from '@/core/entities/SigninEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.signinsRepository)
		private signinsRepository: SigninsRepository,

		private signinEntityService: SigninEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.signinsRepository.createQueryBuilder('signin'), ps.sinceId, ps.untilId)
				.andWhere('signin.userId = :meId', { meId: me.id });

			const history = await query.limit(ps.limit).getMany();

			return await Promise.all(history.map(record => this.signinEntityService.pack(record)));
		});
	}
}
