import define from '../../define.js';
import { Apps } from '@/models/index.js';

export const meta = {
	tags: ['account', 'app'],

	requireCredential: true,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'App',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const query = {
		userId: user.id,
	};

	const apps = await Apps.find({
		where: query,
		take: ps.limit,
		skip: ps.offset,
	});

	return await Promise.all(apps.map(app => Apps.pack(app, user, {
		detail: true,
	})));
});
