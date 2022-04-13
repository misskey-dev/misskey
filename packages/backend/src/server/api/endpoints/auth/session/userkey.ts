import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { Apps, AuthSessions, AccessTokens, Users } from '@/models/index.js';

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			accessToken: {
				type: 'string',
				optional: false, nullable: false,
			},

			user: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'UserDetailedNotMe',
			},
		},
	},

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: 'fcab192a-2c5a-43b7-8ad8-9b7054d8d40d',
		},

		noSuchSession: {
			message: 'No such session.',
			code: 'NO_SUCH_SESSION',
			id: '5b5a1503-8bc8-4bd0-8054-dc189e8cdcb3',
		},

		pendingSession: {
			message: 'This session is not completed yet.',
			code: 'PENDING_SESSION',
			id: '8c8a4145-02cc-4cca-8e66-29ba60445a8e',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		appSecret: { type: 'string' },
		token: { type: 'string' },
	},
	required: ['appSecret', 'token'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
	// Lookup app
	const app = await Apps.findOneBy({
		secret: ps.appSecret,
	});

	if (app == null) {
		throw new ApiError(meta.errors.noSuchApp);
	}

	// Fetch token
	const session = await AuthSessions.findOneBy({
		token: ps.token,
		appId: app.id,
	});

	if (session == null) {
		throw new ApiError(meta.errors.noSuchSession);
	}

	if (session.userId == null) {
		throw new ApiError(meta.errors.pendingSession);
	}

	// Lookup access token
	const accessToken = await AccessTokens.findOneByOrFail({
		appId: app.id,
		userId: session.userId,
	});

	// Delete session
	AuthSessions.delete(session.id);

	return {
		accessToken: accessToken.token,
		user: await Users.pack(session.userId, null, {
			detail: true,
		}),
	};
});
