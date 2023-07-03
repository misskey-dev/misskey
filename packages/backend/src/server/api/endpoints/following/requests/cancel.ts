import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { FollowingsRepository } from '@/models/index.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'following/requests/cancel'> {
	name = 'following/requests/cancel' as const;
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private getterService: GetterService,
		private userFollowingService: UserFollowingService,
	) {
		super(async (ps, me) => {
			// Fetch followee
			const followee = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(this.meta.errors.noSuchUser);
				throw err;
			});

			try {
				await this.userFollowingService.cancelFollowRequest(followee, me);
			} catch (err) {
				if (err instanceof IdentifiableError) {
					if (err.id === '17447091-ce07-46dd-b331-c1fd4f15b1e7') throw new ApiError(this.meta.errors.followRequestNotFound);
				}
				throw err;
			}

			return await this.userEntityService.pack(followee.id, me);
		});
	}
}
