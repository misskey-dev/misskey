import define from '../../define.js';
import { AccessTokens, Apps } from '@/models/index.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		sort: { type: 'string', enum: ['desc', 'asc'], default: "desc" },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Get tokens
	const tokens = await AccessTokens.find({
		where: {
			userId: user.id,
		},
		take: ps.limit,
		skip: ps.offset,
		order: {
			id: ps.sort === 'asc' ? 1 : -1,
		},
	});

	return await Promise.all(tokens.map(token => Apps.pack(token.appId, user, {
		detail: true,
	})));
});
