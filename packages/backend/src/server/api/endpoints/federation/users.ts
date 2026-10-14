/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { packedUserDetailedNotMeSchema } from '@/models/schema/user.js';

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	res: v.array(packedUserDetailedNotMeSchema),
} as const;

export const paramDef = v.object({
	host: v.string(),
	...mi.paginationEntries({ max: 100, default: 10 }),
	...mi.paginationDateEntries(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.usersRepository.createQueryBuilder('user'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('user.host = :host', { host: ps.host });

			const users = await query
				.limit(ps.limit)
				.getMany();

			return await this.userEntityService.packMany(users, me, { schema: 'UserDetailedNotMe' });
		});
	}
}
