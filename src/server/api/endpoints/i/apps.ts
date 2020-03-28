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
	}
};

export default define(meta, async (ps, user) => {
	const query = AccessTokens.createQueryBuilder('token')
		.where('token.userId = :userId', { userId: user.id });

	switch (ps.sort) {
		case '+createdAt': query.orderBy('token.createdAt', 'DESC'); break;
		case '-createdAt': query.orderBy('token.createdAt', 'ASC'); break;
		case '+lastUsedAt': query.andWhere('token.lastUsedAt IS NOT NULL').orderBy('token.lastUsedAt', 'DESC'); break;
		case '-lastUsedAt': query.andWhere('token.lastUsedAt IS NOT NULL').orderBy('token.lastUsedAt', 'ASC'); break;
		default: query.orderBy('token.id', 'ASC'); break;
	}

	const tokens = await query.getMany();

	return await Promise.all(tokens.map(token => ({
		id: token.id,
		name: token.name,
		createdAt: token.createdAt,
		lastUsedAt: token.lastUsedAt,
	})));
});
