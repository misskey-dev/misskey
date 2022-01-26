import $ from 'cafy';
import define from '../../define';
import { AccessTokens } from '@/models/index';
import { genId } from '@/misc/gen-id';
import { secureRndstr } from '@/misc/secure-rndstr';

export const meta = {
	tags: ['auth'],

	requireCredential: true,

	secure: true,

	params: {
		session: {
			validator: $.nullable.str,
		},

		name: {
			validator: $.nullable.optional.str,
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

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			token: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	// Generate access token
	const accessToken = secureRndstr(32, true);

	const now = new Date();

	// Insert access token doc
	await AccessTokens.insert({
		id: genId(),
		createdAt: now,
		lastUsedAt: now,
		session: ps.session,
		userId: user.id,
		token: accessToken,
		hash: accessToken,
		name: ps.name,
		description: ps.description,
		iconUrl: ps.iconUrl,
		permission: ps.permission,
	});

	return {
		token: accessToken,
	};
});
