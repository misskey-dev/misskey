/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull, MoreThan, Not } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import type { FollowingsRepository, InstancesRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { InstanceEntityService } from '@/core/entities/InstanceEntityService.js';
import { DI } from '@/di-symbols.js';
import { packedFederationInstanceSchema } from '@/models/schema/federation-instance.js';

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	allowGet: true,
	cacheSec: 60 * 60,

	res: v.object({
		topSubInstances: v.array(packedFederationInstanceSchema),
		otherFollowersCount: v.number(),
		topPubInstances: v.array(packedFederationInstanceSchema),
		otherFollowingCount: v.number(),
	}),
} as const;

export const paramDef = v.object({
	limit: mi.limit({ max: 100, def: 10 }),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
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
				topSubInstances: this.instanceEntityService.packMany(topSubInstances, me),
				otherFollowersCount: Math.max(0, allSubCount - gotSubCount),
				topPubInstances: this.instanceEntityService.packMany(topPubInstances, me),
				otherFollowingCount: Math.max(0, allPubCount - gotPubCount),
			});
		});
	}
}
