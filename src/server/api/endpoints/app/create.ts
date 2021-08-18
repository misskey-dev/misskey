import $ from 'cafy';
import define from '../../define';
import { Apps } from '../../../../models';
import { genId } from '@/misc/gen-id';
import { unique } from '../../../../prelude/array';
import { secureRndstr } from '@/misc/secure-rndstr';

export const meta = {
	tags: ['app'],

	requireCredential: false as const,

	params: {
		name: {
			validator: $.str,
		},

		description: {
			validator: $.str,
		},

		permission: {
			validator: $.arr($.str).unique(),
		},

		// TODO: Check it is valid url
		callbackUrl: {
			validator: $.optional.nullable.str,
			default: null,
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'App',
	},
};

export default define(meta, async (ps, user) => {
	// Generate secret
	const secret = secureRndstr(32, true);

	// for backward compatibility
	const permission = unique(ps.permission.map(v => v.replace(/^(.+)(\/|-)(read|write)$/, '$3:$1')));

	// Create account
	const app = await Apps.save({
		id: genId(),
		createdAt: new Date(),
		userId: user ? user.id : null,
		name: ps.name,
		description: ps.description,
		permission,
		callbackUrl: ps.callbackUrl,
		secret: secret
	});

	return await Apps.pack(app, null, {
		detail: true,
		includeSecret: true
	});
});
