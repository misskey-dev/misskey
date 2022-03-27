import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { AuthSessions } from '@/models/index.js';

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	errors: {
		noSuchSession: {
			message: 'No such session.',
			code: 'NO_SUCH_SESSION',
			id: 'bd72c97d-eba7-4adb-a467-f171b8847250',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			app: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'App',
			},
			token: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		token: { type: 'string' },
	},
	required: ['token'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Lookup session
	const session = await AuthSessions.findOneBy({
		token: ps.token,
	});

	if (session == null) {
		throw new ApiError(meta.errors.noSuchSession);
	}

	return await AuthSessions.pack(session, user);
});
