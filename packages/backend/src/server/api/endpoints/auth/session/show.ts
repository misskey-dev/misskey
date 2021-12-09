import $ from 'cafy';
import define from '../../../define';
import { ApiError } from '../../../error';
import { AuthSessions } from '@/models/index';

export const meta = {
	tags: ['auth'],

	requireCredential: false as const,

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
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			id: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'id',
			},
			app: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				ref: 'App',
			},
			token: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			},
		},
	},
};

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
