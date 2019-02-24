import $ from 'cafy';
import App from '../../../../../models/app';
import AuthSess from '../../../../../models/auth-session';
import AccessToken from '../../../../../models/access-token';
import { pack } from '../../../../../models/user';
import define from '../../../define';
import { ApiError } from '../../../error';

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	params: {
		appSecret: {
			validator: $.str,
			desc: {
				'ja-JP': 'アプリケーションのシークレットキー',
				'en-US': 'The secret key of your application.'
			}
		},

		token: {
			validator: $.str,
			desc: {
				'ja-JP': 'セッションのトークン',
				'en-US': 'The token of a session.'
			}
		}
	},

	res: {
		type: 'object',
		properties: {
			accessToken: {
				type: 'string',
				description: 'ユーザーのアクセストークン',
			},

			user: {
				type: 'User',
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
	const app = await App.findOne({
		secret: ps.appSecret
	});

	if (app == null) {
		throw new ApiError(meta.errors.noSuchApp);
	}

	// Fetch token
	const session = await AuthSess
		.findOne({
			token: ps.token,
			appId: app._id
		});

	if (session === null) {
		throw new ApiError(meta.errors.noSuchSession);
	}

	if (session.userId == null) {
		throw new ApiError(meta.errors.pendingSession);
	}

	// Lookup access token
	const accessToken = await AccessToken.findOne({
		appId: app._id,
		userId: session.userId
	});

	// Delete session

	/* https://github.com/Automattic/monk/issues/178
	AuthSess.deleteOne({
		_id: session._id
	});
	*/
	AuthSess.remove({
		_id: session._id
	});

	return {
		accessToken: accessToken.token,
		user: await pack(session.userId, null, {
			detail: true
		})
	};
});
