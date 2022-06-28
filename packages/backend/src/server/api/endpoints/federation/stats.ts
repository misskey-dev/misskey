import { MoreThan } from 'typeorm';
import { Instances } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import define from '../../define.js';

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	const [topSubInstances, topPubInstances] = await Promise.all([
		Instances.find({
			where: {
				followersCount: MoreThan(0),
			},
			order: {
				followersCount: 'DESC',
			},
			take: 10,
		}),
		Instances.find({
			where: {
				followingCount: MoreThan(0),
			},
			order: {
				followingCount: 'DESC',
			},
			take: 10,
		}),
	]);

	return await awaitAll({
		topSubInstances: Instances.packMany(topSubInstances),
		topPubInstances: Instances.packMany(topPubInstances),
	});
});
