import * as crypto from 'crypto';
import $ from 'cafy';
import define from '../../define';
import { ApiError } from '../../error';
import { AuthSessions, AccessTokens, Apps } from '../../../../models';
import { genId } from '@/misc/gen-id';
import { secureRndstr } from '@/misc/secure-rndstr';

export const meta = {
	tags: ['auth'],

	requireCredential: true as const,

	secure: true,

	params: {
		token: {
			validator: $.str
		}
	},

	errors: {
		noSuchSession: {
			message: 'No such session.',
			code: 'NO_SUCH_SESSION',
			id: '9c72d8de-391a-43c1-9d06-08d29efde8df'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Fetch token
	const session = await AuthSessions
		.findOne({ token: ps.token });

	if (session == null) {
		throw new ApiError(meta.errors.noSuchSession);
	}

	// Generate access token
	const accessToken = secureRndstr(32, true);

	// Fetch exist access token
	const exist = await AccessTokens.findOne({
		appId: session.appId,
		userId: user.id,
	});

	if (exist == null) {
		// Lookup app
		const app = await Apps.findOneOrFail(session.appId);

		// Generate Hash
		const sha256 = crypto.createHash('sha256');
		sha256.update(accessToken + app.secret);
		const hash = sha256.digest('hex');

		const now = new Date();

		// Insert access token doc
		await AccessTokens.insert({
			id: genId(),
			createdAt: now,
			lastUsedAt: now,
			appId: session.appId,
			userId: user.id,
			token: accessToken,
			hash: hash
		});
	}

	// Update session
	await AuthSessions.update(session.id, {
		userId: user.id
	});
});
