import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GetterService } from '@/server/api/GetterService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'following/requests/accept'> {
	name = 'following/requests/accept' as const;
	constructor(
		private getterService: GetterService,
		private userFollowingService: UserFollowingService,
	) {
		super(async (ps, me) => {
			// Fetch follower
			const follower = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(this.meta.errors.noSuchUser);
				throw err;
			});

			await this.userFollowingService.acceptFollowRequest(me, follower).catch(err => {
				if (err.id === '8884c2dd-5795-4ac9-b27e-6a01d38190f9') throw new ApiError(this.meta.errors.noFollowRequest);
				throw err;
			});

			return;
		});
	}
}
