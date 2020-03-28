import rndstr from 'rndstr';
import $ from 'cafy';
import define from '../../define';
import { AccessTokens } from '../../../../models';
import { genId } from '../../../../misc/gen-id';

export const meta = {
	tags: ['auth'],

	requireCredential: true as const,

	secure: true,

	params: {
		session: {
			validator: $.str
		},

		name: {
			validator: $.nullable.optional.str
		},

		description: {
			validator: $.nullable.optional.str,
		},

		iconUrl: {
			validator: $.nullable.optional.str,
		},

		permission: {
			validator: $.arr($.str).unique(),
		},
	},
};

export default define(meta, async (ps, user) => {
	// Generate access token
	const accessToken = rndstr('a-zA-Z0-9', 32);

	// Insert access token doc
	await AccessTokens.save({
		id: genId(),
		createdAt: new Date(),
		session: ps.session,
		userId: user.id,
		token: accessToken,
		hash: accessToken,
		name: ps.name,
		description: ps.description,
		iconUrl: ps.iconUrl,
		permission: ps.permission,
	});
});
