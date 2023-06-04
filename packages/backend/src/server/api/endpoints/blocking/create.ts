import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository, BlockingsRepository } from '@/models/index.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApiError } from '../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'blocking/create'> {
	name = 'blocking/create' as const;
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private userEntityService: UserEntityService,
		private getterService: GetterService,
		private userBlockingService: UserBlockingService,
	) {
		super(async (ps, me) => {
			const blocker = await this.usersRepository.findOneByOrFail({ id: me.id });

			// 自分自身
			if (me.id === ps.userId) {
				throw new ApiError(this.meta.errors.blockeeIsYourself);
			}

			// Get blockee
			const blockee = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(this.meta.errors.noSuchUser);
				throw err;
			});

			// Check if already blocking
			const exist = await this.blockingsRepository.findOneBy({
				blockerId: blocker.id,
				blockeeId: blockee.id,
			});

			if (exist != null) {
				throw new ApiError(this.meta.errors.alreadyBlocking);
			}

			await this.userBlockingService.block(blocker, blockee);

			return await this.userEntityService.pack(blockee.id, blocker, {
				detail: true,
			});
		});
	}
}
