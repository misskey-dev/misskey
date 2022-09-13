import * as crypto from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { AuthSessions, AccessTokens, Apps } from '@/models/index.js';
import type { IdService } from '@/services/IdService.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['auth'],

	requireCredential: true,

	secure: true,

	errors: {
		noSuchSession: {
			message: 'No such session.',
			code: 'NO_SUCH_SESSION',
			id: '9c72d8de-391a-43c1-9d06-08d29efde8df',
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
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Fetch token
			const session = await AuthSessions
				.findOneBy({ token: ps.token });

			if (session == null) {
				throw new ApiError(meta.errors.noSuchSession);
			}

			// Generate access token
			const accessToken = secureRndstr(32, true);

			// Fetch exist access token
			const exist = await AccessTokens.findOneBy({
				appId: session.appId,
				userId: me.id,
			});

			if (exist == null) {
				// Lookup app
				const app = await Apps.findOneByOrFail({ id: session.appId });

				// Generate Hash
				const sha256 = crypto.createHash('sha256');
				sha256.update(accessToken + app.secret);
				const hash = sha256.digest('hex');

				const now = new Date();

				// Insert access token doc
				await AccessTokens.insert({
					id: this.idService.genId(),
					createdAt: now,
					lastUsedAt: now,
					appId: session.appId,
					userId: me.id,
					token: accessToken,
					hash: hash,
				});
			}

			// Update session
			await AuthSessions.update(session.id, {
				userId: me.id,
			});
		});
	}
}
