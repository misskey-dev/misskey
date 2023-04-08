import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';

import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';

import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';

import { AccountMoveService } from '@/core/AccountMoveService.js';
import { RemoteUserResolveService } from '@/core/RemoteUserResolveService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApiLoggerService } from '@/server/api/ApiLoggerService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';

export const meta = {
	tags: ['users'],

	secure: true,
	requireCredential: true,
	limit: {
		duration: ms('1day'),
		max: 5,
	},

	errors: {
		noSuchMoveTarget: {
			message: 'No such move target.',
			code: 'NO_SUCH_MOVE_TARGET',
			id: 'b5c90186-4ab0-49c8-9bba-a1f76c202ba4',
		},
		remoteAccountForbids: {
			message:
				'Remote account doesn\'t have proper \'Known As\' alias. Did you remember to set it?',
			code: 'REMOTE_ACCOUNT_FORBIDS',
			id: 'b5c90186-4ab0-49c8-9bba-a1f766282ba4',
		},
		notRemote: {
			message: 'User is not remote. You can only migrate to other instances.',
			code: 'NOT_REMOTE',
			id: '4362f8dc-731f-4ad8-a694-be2a88922a24',
		},
		rootForbidden: {
			message: 'The root can\'t migrate.',
			code: 'NOT_ROOT_FORBIDDEN',
			id: '4362e8dc-731f-4ad8-a694-be2a88922a24',
		},
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
		localUriNull: {
			message: 'Local User ActivityPup URI is null.',
			code: 'URI_NULL',
			id: '95ba11b9-90e8-43a5-ba16-7acc1ab32e71',
		},
		alreadyMoved: {
			message: 'Account was already moved to another account.',
			code: 'ALREADY_MOVED',
			id: 'b234a14e-9ebe-4581-8000-074b3c215962',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		moveToAccount: { type: 'string' },
	},
	required: ['moveToAccount'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private userEntityService: UserEntityService,
		private remoteUserResolveService: RemoteUserResolveService,
		private apiLoggerService: ApiLoggerService,
		private accountMoveService: AccountMoveService,
		private getterService: GetterService,
		private apPersonService: ApPersonService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// check parameter
			if (!ps.moveToAccount) throw new ApiError(meta.errors.noSuchMoveTarget);
			// abort if user is the root
			if (me.isRoot) throw new ApiError(meta.errors.rootForbidden);
			// abort if user has already moved
			if (me.movedToUri) throw new ApiError(meta.errors.alreadyMoved);

			let unfiltered = ps.moveToAccount;
			if (!unfiltered) throw new ApiError(meta.errors.noSuchMoveTarget);

			// parse user's input into the destination account
			if (unfiltered.startsWith('acct:')) unfiltered = unfiltered.substring(5);
			if (unfiltered.startsWith('@')) unfiltered = unfiltered.substring(1);
			if (!unfiltered.includes('@')) throw new ApiError(meta.errors.notRemote);

			const userAddress = unfiltered.split('@');
			// retrieve the destination account
			let moveTo = await this.remoteUserResolveService.resolveUser(userAddress[0], userAddress[1]).catch((e) => {
				this.apiLoggerService.logger.warn(`failed to resolve remote user: ${e}`);
				throw new ApiError(meta.errors.noSuchMoveTarget);
			});
			const remoteMoveTo = await this.getterService.getRemoteUser(moveTo.id);
			if (!remoteMoveTo.uri) throw new ApiError(meta.errors.uriNull);

			// update local db
			await this.apPersonService.updatePerson(remoteMoveTo.uri);
			// retrieve updated user
			moveTo = await this.apPersonService.resolvePerson(remoteMoveTo.uri);
			// only allow moving to a remote account
			if (this.userEntityService.isLocalUser(moveTo)) throw new ApiError(meta.errors.notRemote);

			let allowed = false;

			const fromUrl = `${this.config.url}/users/${me.id}`;
			// make sure that the user has indicated the old account as an alias
			moveTo.alsoKnownAs?.forEach((elem) => {
				if (fromUrl.includes(elem)) allowed = true;
			});

			// abort if unintended
			if (!(allowed && moveTo.uri && fromUrl)) throw new ApiError(meta.errors.remoteAccountForbids);

			return await this.accountMoveService.moveToRemote(me, moveTo);
		});
	}
}
