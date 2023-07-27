/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import type { FollowRequestsRepository } from '@/models/index.js';
import { FollowRequestEntityService } from '@/core/entities/FollowRequestEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['following', 'account'],

	requireCredential: true,

	kind: 'read:following',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				follower: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'UserLite',
				},
				followee: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'UserLite',
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		private followRequestEntityService: FollowRequestEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.followRequestsRepository.createQueryBuilder('request'), ps.sinceId, ps.untilId)
				.andWhere('request.followeeId = :meId', { meId: me.id });

			const requests = await query
				.limit(ps.limit)
				.getMany();

			return await Promise.all(requests.map(req => this.followRequestEntityService.pack(req)));
		});
	}
}
