/*
 * SPDX-FileCopyrightText: anatawa12
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { NirilaDeleteUserLogRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { QueryService } from '@/core/QueryService.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:nirila-delete-user-log-access',

	errors: {
		notFound: {
			message: 'DeleteLog satisfies the request not found',
			code: 'NOT_FOUND',
			id: 'd29927d1-5b8c-4200-aa05-5537722ee7ab',
		},
	},

	res: {
		oneOf: [
			{ type: "object" },
			{
				type: 'array',
				items: { type: 'object' },
			},
		]
	},
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },

		// access single by id
		email: { type: 'string' },
		username: { type: 'string' },
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.nirilaDeleteUserLogRepository)
		private nirilaDeleteUserLogRepository: NirilaDeleteUserLogRepository,

		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// single query
			if (ps.email) {
				const found = await this.nirilaDeleteUserLogRepository.findOneBy({ email: ps.email });
				if (!found) throw new ApiError(meta.errors.notFound);
				return found.info;
			}

			if (ps.username) {
				const found = await this.nirilaDeleteUserLogRepository.findOneBy({ username: ps.username });
				if (!found) throw new ApiError(meta.errors.notFound);
				return found.info;
			}

			if (ps.userId) {
				const found = await this.nirilaDeleteUserLogRepository.findOneBy({ userId: ps.userId });
				if (!found) throw new ApiError(meta.errors.notFound);
				return found.info;
			}

			// list query

			const logs = await this.queryService.makePaginationQuery(this.nirilaDeleteUserLogRepository.createQueryBuilder('deleteLog'), ps.sinceId, ps.untilId)
				.limit(ps.limit)
				.getMany();

			return logs.map(x => Object.assign(x.info, { id: x.id }));
		});
	}
}
