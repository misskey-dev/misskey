import $ from 'cafy';
import define from '../../../define';
import { ApiError } from '../../../error';
import { Apps, AuthSessions, AccessTokens, Users } from '../../../../../models';

export const meta = {
	tags: ['auth'],

	requireCredential: false as const,

	params: {
		appSecret: {
			validator: $.str,
		},

		token: {
			validator: $.str,
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			accessToken: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				description: 'ユーザーのアクセストークン',
			},

			user: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				ref: 'User',
				description: '認証したユーザー'
			},
		}
	},

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: 'fcab192a-2c5a-43b7-8ad8-9b7054d8d40d'
		},

		noSuchSession: {
			message: 'No such session.',
			code: 'NO_SUCH_SESSION',
			id: '5b5a1503-8bc8-4bd0-8054-dc189e8cdcb3'
		},

		pendingSession: {
			message: 'This session is not completed yet.',
			code: 'PENDING_SESSION',
			id: '8c8a4145-02cc-4cca-8e66-29ba60445a8e'
		}
	}
};

export default define(meta, async (ps) => {
	// Lookup app
	const app = await Apps.findOne({
		secret: ps.appSecret
	});

	if (app == null) {
		throw new ApiError(meta.errors.noSuchApp);
	}

	// Fetch token
	const session = await AuthSessions.findOne({
		token: ps.token,
		appId: app.id
	});

	if (session == null) {
		throw new ApiError(meta.errors.noSuchSession);
	}

	if (session.userId == null) {
		throw new ApiError(meta.errors.pendingSession);
	}

	// Lookup access token
	const accessToken = await AccessTokens.findOneOrFail({
		appId: app.id,
		userId: session.userId
	});

	// Delete session
	AuthSessions.delete(session.id);

	return {
		accessToken: accessToken.token,
		user: await Users.pack(session.userId, null, {
			detail: true
		})
	};
});
