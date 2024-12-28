/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { FollowingsRepository } from '@/models/_.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['following', 'users'],

	limit: {
		duration: ms('1hour'),
		max: 100,
	},

	requireCredential: true,

	kind: 'write:following',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '5b12c78d-2b28-4dca-99d2-f56139b42ff8',
		},

		followeeIsYourself: {
			message: 'Followee is yourself.',
			code: 'FOLLOWEE_IS_YOURSELF',
			id: 'd9e400b9-36b0-4808-b1d8-79e707f1296c',
		},

		notFollowing: {
			message: 'You are not following that user.',
			code: 'NOT_FOLLOWING',
			id: '5dbf82f5-c92b-40b1-87d1-6c8c0741fd09',
		},

		cannotUnfollowDueToServerPolicy: {
			message: 'You cannot unfollow that user due to server policy.',
			code: 'CANNOT_UNFOLLOW_DUE_TO_SERVER_POLICY',
			id: '19f25f61-0141-4683-99dc-217a88d633cb',
			httpStatusCode: 403,
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

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private getterService: GetterService,
		private userFollowingService: UserFollowingService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const follower = me;

			// Check if the followee is yourself
			if (me.id === ps.userId) {
				throw new ApiError(meta.errors.followeeIsYourself);
			}

			// Get followee
			const followee = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			// Check not following
			const exist = await this.followingsRepository.exists({
				where: {
					followerId: follower.id,
					followeeId: followee.id,
				},
			});

			if (!exist) {
				throw new ApiError(meta.errors.notFollowing);
			}

			await this.userFollowingService.unfollow(follower, followee).catch((err) => {
				if (err instanceof IdentifiableError && err.id === meta.errors.cannotUnfollowDueToServerPolicy.id) {
					throw new ApiError(meta.errors.cannotUnfollowDueToServerPolicy);
				}
			});

			return await this.userEntityService.pack(followee.id, me);
		});
	}
}
