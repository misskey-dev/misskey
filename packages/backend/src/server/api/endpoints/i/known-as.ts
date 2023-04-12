import { Injectable } from '@nestjs/common';
import ms from 'ms';

import { User } from '@/models/entities/User.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';

import { AccountMoveService } from '@/core/AccountMoveService.js';
import { RemoteUserResolveService } from '@/core/RemoteUserResolveService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApiLoggerService } from '@/server/api/ApiLoggerService.js';

export const meta = {
	tags: ['users'],

	secure: true,
	requireCredential: true,

	limit: {
		duration: ms('1day'),
		max: 30,
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'fcd2eef9-a9b2-4c4f-8624-038099e90aa5',
		},
		notRemote: {
			message: 'User is not remote. You can only migrate from other instances.',
			code: 'NOT_REMOTE',
			id: '4362f8dc-731f-4ad8-a694-be2a88922a24',
		},
		uriNull: {
			message: 'User ActivityPup URI is null.',
			code: 'URI_NULL',
			id: 'bf326f31-d430-4f97-9933-5d61e4d48a23',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		alsoKnownAs: { type: 'string' },
	},
	required: ['alsoKnownAs'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private userEntityService: UserEntityService,
		private remoteUserResolveService: RemoteUserResolveService,
		private apiLoggerService: ApiLoggerService,
		private accountMoveService: AccountMoveService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Check parameter
			if (!ps.alsoKnownAs) throw new ApiError(meta.errors.noSuchUser);

			let unfiltered = ps.alsoKnownAs;
			const updates = {} as Partial<User>;

			if (!unfiltered) {
				updates.alsoKnownAs = null;
			} else {
				// Parse user's input into the old account
				if (unfiltered.startsWith('acct:')) unfiltered = unfiltered.substring(5);
				if (unfiltered.startsWith('@')) unfiltered = unfiltered.substring(1);
				if (!unfiltered.includes('@')) throw new ApiError(meta.errors.notRemote);

				const userAddress = unfiltered.split('@');
				// Retrieve the old account
				const knownAs = await this.remoteUserResolveService.resolveUser(userAddress[0], userAddress[1]).catch((e) => {
					this.apiLoggerService.logger.warn(`failed to resolve remote user: ${e}`);
					throw new ApiError(meta.errors.noSuchUser);
				});

				const toUrl: string | null = knownAs.uri;
				if (!toUrl) throw new ApiError(meta.errors.uriNull);
				// Only allow moving from a remote account
				if (this.userEntityService.isLocalUser(knownAs)) throw new ApiError(meta.errors.notRemote);

				updates.alsoKnownAs = updates.alsoKnownAs?.concat([toUrl]) ?? [toUrl];
			}

			return await this.accountMoveService.createAlias(me, updates);
		});
	}
}
