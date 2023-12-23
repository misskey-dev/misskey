/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import ms from 'ms';

import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';

import { MiLocalUser, MiRemoteUser } from '@/models/User.js';

import { AccountMoveService } from '@/core/AccountMoveService.js';
import { RemoteUserResolveService } from '@/core/RemoteUserResolveService.js';
import { ApiLoggerService } from '@/server/api/ApiLoggerService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

import * as Acct from '@/misc/acct.js';

export const meta = {
	tags: ['users'],

	secure: true,
	requireCredential: true,
	prohibitMoved: true,
	limit: {
		duration: ms('1day'),
		max: 5,
	},

	errors: {
		destinationAccountForbids: {
			message:
				'Destination account doesn\'t have proper \'Known As\' alias, or has already moved.',
			code: 'DESTINATION_ACCOUNT_FORBIDS',
			id: 'b5c90186-4ab0-49c8-9bba-a1f766282ba4',
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

	res: {
		type: 'object',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		moveToAccount: { type: 'string' },
	},
	required: ['moveToAccount'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private remoteUserResolveService: RemoteUserResolveService,
		private apiLoggerService: ApiLoggerService,
		private accountMoveService: AccountMoveService,
		private getterService: GetterService,
		private apPersonService: ApPersonService,
		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// check parameter
			if (!ps.moveToAccount) throw new ApiError(meta.errors.noSuchUser);
			// abort if user is the root
			if (me.isRoot) throw new ApiError(meta.errors.rootForbidden);
			// abort if user has already moved
			if (me.movedToUri) throw new ApiError(meta.errors.alreadyMoved);

			// parse user's input into the destination account
			const { username, host } = Acct.parse(ps.moveToAccount);
			// retrieve the destination account
			let moveTo = await this.remoteUserResolveService.resolveUser(username, host).catch((e) => {
				this.apiLoggerService.logger.warn(`failed to resolve remote user: ${e}`);
				throw new ApiError(meta.errors.noSuchUser);
			});
			const destination = await this.getterService.getUser(moveTo.id) as MiLocalUser | MiRemoteUser;
			const newUri = this.userEntityService.getUserUri(destination);

			// update local db
			await this.apPersonService.updatePerson(newUri);
			// retrieve updated user
			moveTo = await this.apPersonService.resolvePerson(newUri);

			// make sure that the user has indicated the old account as an alias
			const fromUrl = this.userEntityService.genLocalUserUri(me.id);
			let allowed = false;
			if (moveTo.alsoKnownAs) {
				for (const knownAs of moveTo.alsoKnownAs) {
					if (knownAs.includes(fromUrl)) {
						allowed = true;
						break;
					}
				}
			}

			// abort if unintended
			if (!allowed || moveTo.movedToUri) throw new ApiError(meta.errors.destinationAccountForbids);

			return await this.accountMoveService.moveFromLocal(me, moveTo);
		});
	}
}
