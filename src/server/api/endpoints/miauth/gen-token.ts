import $ from 'cafy';
import define from '../../define.js';
import { AccessTokens } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';

export const meta = {
	tags: ['auth'],

	requireCredential: true as const,

	secure: true,

	params: {
		session: {
			validator: $.nullable.str
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

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			token: {
				type: 'string' as const,
				optional: false as const, nullable: false as const
			}
		}
	}
};

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
		token: accessToken
	};
});
