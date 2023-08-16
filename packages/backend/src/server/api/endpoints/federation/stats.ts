/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull, MoreThan, Not } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { FollowingsRepository, InstancesRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { InstanceEntityService } from '@/core/entities/InstanceEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private instanceEntityService: InstanceEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const [topSubInstances, topPubInstances, allSubCount, allPubCount] = await Promise.all([
				this.instancesRepository.find({
					where: {
						followersCount: MoreThan(0),
					},
					order: {
						followersCount: 'DESC',
					},
					take: ps.limit,
				}),
				this.instancesRepository.find({
					where: {
						followingCount: MoreThan(0),
					},
					order: {
						followingCount: 'DESC',
					},
					take: ps.limit,
				}),
				this.followingsRepository.count({
					where: {
						followeeHost: Not(IsNull()),
					},
				}),
				this.followingsRepository.count({
					where: {
						followerHost: Not(IsNull()),
					},
				}),
			]);

			const gotSubCount = topSubInstances.map(x => x.followersCount).reduce((a, b) => a + b, 0);
			const gotPubCount = topPubInstances.map(x => x.followingCount).reduce((a, b) => a + b, 0);

			return await awaitAll({
				topSubInstances: this.instanceEntityService.packMany(topSubInstances),
				otherFollowersCount: Math.max(0, allSubCount - gotSubCount),
				topPubInstances: this.instanceEntityService.packMany(topPubInstances),
				otherFollowingCount: Math.max(0, allPubCount - gotPubCount),
			});
		});
	}
}
