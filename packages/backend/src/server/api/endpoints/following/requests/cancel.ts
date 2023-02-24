import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { FollowingsRepository } from '@/models/index.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['following', 'account'],

	requireCredential: true,

	kind: 'write:following',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '4e68c551-fc4c-4e46-bb41-7d4a37bf9dab',
		},

		followRequestNotFound: {
			message: 'Follow request not found.',
			code: 'FOLLOW_REQUEST_NOT_FOUND',
			id: '089b125b-d338-482a-9a09-e2622ac9f8d4',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserLite',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private getterService: GetterService,
		private userFollowingService: UserFollowingService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Fetch followee
			const followee = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			try {
				await this.userFollowingService.cancelFollowRequest(followee, me);
			} catch (err) {
				if (err instanceof IdentifiableError) {
					if (err.id === '17447091-ce07-46dd-b331-c1fd4f15b1e7') throw new ApiError(meta.errors.followRequestNotFound);
				}
				throw err;
			}

			return await this.userEntityService.pack(followee.id, me);
		});
	}
}
