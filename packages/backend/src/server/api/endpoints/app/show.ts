import define from '../../define.js';
import { ApiError } from '../../error.js';
import { Apps } from '@/models/index.js';

export const meta = {
	tags: ['app'],

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: 'dce83913-2dc6-4093-8a7b-71dbb11718a3',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'App',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		appId: { type: 'string', format: 'misskey:id' },
	},
	required: ['appId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user, token) => {
	const isSecure = user != null && token == null;

	// Lookup app
	const ap = await Apps.findOneBy({ id: ps.appId });

	if (ap == null) {
		throw new ApiError(meta.errors.noSuchApp);
	}

	return await Apps.pack(ap, user, {
		detail: true,
		includeSecret: isSecure && (ap.userId === user!.id),
	});
});
