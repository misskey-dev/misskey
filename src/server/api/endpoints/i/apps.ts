import $ from 'cafy';
import define from '../../define';
import { AccessTokens } from '../../../../models';

export const meta = {
	requireCredential: true as const,

	secure: true,

	params: {
		sort: {
			validator: $.optional.str.or([
				'+createdAt',
				'-createdAt',
				'+lastUsedAt',
				'-lastUsedAt',
			]),
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			id: {
				type: 'string' as const,
				optional: false as const, nullable: false as const
			},
			name: {
				type: 'string' as const,
				optional: false as const, nullable: false as const
			},
			createdAt: {
				type: 'string' as const,
				optional: false as const, nullable: false as const
			},
			lastUsedAt: {
				type: 'string' as const,
				optional: false as const, nullable: false as const
			},
			permission: {
				type: 'array' as const,
				optional: false as const, nullable: false as const,
				items: {
					type: 'string' as const,
					optional: false as const, nullable: false as const
				}
			},
		}
	}
};

export default define(meta, async (ps, user) => {
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
