import $ from 'cafy';
import define from '../../../define';
import { ApiError } from '../../../error';
import { AuthSessions } from '@/models/index';

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	params: {
		token: {
			validator: $.str,
		},
	},

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

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	// Lookup session
	const session = await AuthSessions.findOne({
		token: ps.token,
	});

	if (session == null) {
		throw new ApiError(meta.errors.noSuchSession);
	}

	return await AuthSessions.pack(session, user);
});
