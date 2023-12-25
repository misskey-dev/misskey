/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull, MoreThan, Not } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { FollowingsRepository, InstancesRepository } from '@/models/_.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { InstanceEntityService } from '@/core/entities/InstanceEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	allowGet: true,
	cacheSec: 60 * 60,

	res: {
		type: 'object',
		optional: false,
		nullable: false,
		properties: {
			topSubInstances: {
				type: 'array',
				optional: false,
				nullable: false,
				items: {
					properties: {
						id: { type: 'string' },
						firstRetrievedAt: { type: 'string' },
						host: { type: 'string' },
						usersCount: { type: 'number' },
						notesCount: { type: 'number' },
						followingCount: { type: 'number' },
						followersCount: { type: 'number' },
						isNotResponding: { type: 'boolean' },
						isSuspended: { type: 'boolean' },
						isBlocked: { type: 'boolean' },
						softwareName: { type: 'string' },
						softwareVersion: { type: 'string' },
						openRegistrations: { type: 'boolean' },
						name: { type: 'string' },
						description: { type: 'string' },
						maintainerName: { type: 'string' },
						maintainerEmail: { type: 'string' },
						isSilenced: { type: 'boolean' },
						iconUrl: { type: 'string' },
						faviconUrl: { type: 'string' },
						themeColor: { type: 'string' },
						infoUpdatedAt: {
							type: 'string',
							nullable: true,
						},
						latestRequestReceivedAt: {
							type: 'string',
							nullable: true,
						},
					}
				},
			},
			otherFollowersCount: { type: 'number' },
			topPubInstances: {
				type: 'array',
				optional: false,
				nullable: false,
				items: {
					properties: {
						id: { type: 'string' },
						firstRetrievedAt: { type: 'string' },
						host: { type: 'string' },
						usersCount: { type: 'number' },
						notesCount: { type: 'number' },
						followingCount: { type: 'number' },
						followersCount: { type: 'number' },
						isNotResponding: { type: 'boolean' },
						isSuspended: { type: 'boolean' },
						isBlocked: { type: 'boolean' },
						softwareName: { type: 'string' },
						softwareVersion: { type: 'string' },
						openRegistrations: { type: 'boolean' },
						name: { type: 'string' },
						description: { type: 'string' },
						maintainerName: { type: 'string' },
						maintainerEmail: { type: 'string' },
						isSilenced: { type: 'boolean' },
						iconUrl: { type: 'string' },
						faviconUrl: { type: 'string' },
						themeColor: { type: 'string' },
						infoUpdatedAt: {
							type: 'string',
							nullable: true,
						},
						latestRequestReceivedAt: {
							type: 'string',
							nullable: true,
						},
					}
				},
			},
			otherFollowingCount: { type: 'number' },
		},
	}
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	},
	required: [],
} as const;

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
				topSubInstances: this.instanceEntityService.packMany(topSubInstances),
				otherFollowersCount: Math.max(0, allSubCount - gotSubCount),
				topPubInstances: this.instanceEntityService.packMany(topPubInstances),
				otherFollowingCount: Math.max(0, allPubCount - gotPubCount),
			});
		});
	}
}
