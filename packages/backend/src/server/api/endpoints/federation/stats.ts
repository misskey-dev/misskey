import { IsNull, MoreThan, Not } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { Followings, Instances } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

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
	) {
		super(meta, paramDef, async (ps, me) => {
			const [topSubInstances, topPubInstances, allSubCount, allPubCount] = await Promise.all([
				Instances.find({
					where: {
						followersCount: MoreThan(0),
					},
					order: {
						followersCount: 'DESC',
					},
					take: ps.limit,
				}),
				Instances.find({
					where: {
						followingCount: MoreThan(0),
					},
					order: {
						followingCount: 'DESC',
					},
					take: ps.limit,
				}),
				Followings.count({
					where: {
						followeeHost: Not(IsNull()),
					},
				}),
				Followings.count({
					where: {
						followerHost: Not(IsNull()),
					},
				}),
			]);

			const gotSubCount = topSubInstances.map(x => x.followersCount).reduce((a, b) => a + b, 0);
			const gotPubCount = topPubInstances.map(x => x.followingCount).reduce((a, b) => a + b, 0);

			return await awaitAll({
				topSubInstances: Instances.packMany(topSubInstances),
				otherFollowersCount: Math.max(0, allSubCount - gotSubCount),
				topPubInstances: Instances.packMany(topPubInstances),
				otherFollowingCount: Math.max(0, allPubCount - gotPubCount),
			});
		});
	}
}
