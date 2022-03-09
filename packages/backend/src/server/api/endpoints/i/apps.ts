import define from '../../define.js';
import { AccessTokens } from '@/models/index.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		sort: { type: 'string', enum: ['+createdAt', '-createdAt', '+lastUsedAt', '-lastUsedAt'] },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const query = AccessTokens.createQueryBuilder('token')
		.where('token.userId = :userId', { userId: user.id });

	switch (ps.sort) {
		case '+createdAt': query.orderBy('token.createdAt', 'DESC'); break;
		case '-createdAt': query.orderBy('token.createdAt', 'ASC'); break;
		case '+lastUsedAt': query.orderBy('token.lastUsedAt', 'DESC'); break;
		case '-lastUsedAt': query.orderBy('token.lastUsedAt', 'ASC'); break;
		default: query.orderBy('token.id', 'ASC'); break;
	}

	const tokens = await query.getMany();

	return await Promise.all(tokens.map(token => ({
		id: token.id,
		name: token.name,
		createdAt: token.createdAt,
		lastUsedAt: token.lastUsedAt,
		permission: token.permission,
	})));
});
