import { Injectable } from '@nestjs/common';
import ms from 'ms';

import { User } from '@/models/entities/User.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';

import { AccountMoveService } from '@/core/AccountMoveService.js';
import { RemoteUserResolveService } from '@/core/RemoteUserResolveService.js';
import { ApiLoggerService } from '@/server/api/ApiLoggerService.js';

export const meta = {
	tags: ['users'],

	secure: true,
	requireCredential: true,
	prohibitMoved: true,

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
		uriNull: {
			message: 'User ActivityPup URI is null.',
			code: 'URI_NULL',
			id: 'bf326f31-d430-4f97-9933-5d61e4d48a23',
		},
		forbiddenToSetYourself: {
			message: 'You can\'t set yourself as your own alias.',
			code: 'FORBIDDEN_TO_SET_YOURSELF',
			id: '25c90186-4ab0-49c8-9bba-a1fa6c202ba4',
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
		private remoteUserResolveService: RemoteUserResolveService,
		private apiLoggerService: ApiLoggerService,
		private accountMoveService: AccountMoveService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let unfiltered = ps.alsoKnownAs;
			const updates = {} as Partial<User>;

			if (!unfiltered) {
				updates.alsoKnownAs = null;
			} else {
				// Parse user's input into the old account
				if (unfiltered.startsWith('acct:')) unfiltered = unfiltered.substring(5);
				if (unfiltered.startsWith('@')) unfiltered = unfiltered.substring(1);
				if (!unfiltered.includes('@')) throw new ApiError(meta.errors.noSuchUser);

				const userAddress = unfiltered.split('@');
				// Retrieve the old account
				const knownAs = await this.remoteUserResolveService.resolveUser(userAddress[0], userAddress[1]).catch((e) => {
					this.apiLoggerService.logger.warn(`failed to resolve dstination user: ${e}`);
					throw new ApiError(meta.errors.noSuchUser);
				});
				if (knownAs.id === me.id) throw new ApiError(meta.errors.forbiddenToSetYourself);

				const toUrl = this.accountMoveService.getUserUri(knownAs);
				if (!toUrl) throw new ApiError(meta.errors.uriNull);

				updates.alsoKnownAs = me.alsoKnownAs?.includes(toUrl) ? me.alsoKnownAs : me.alsoKnownAs?.concat([toUrl]) ?? [toUrl];
			}

			return await this.accountMoveService.createAlias(me, updates);
		});
	}
}
