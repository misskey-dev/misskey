import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository, BlockingsRepository } from '@/models/index.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';
import { GetterService } from '@/server/api/GetterService.js';

export const meta = {
	tags: ['account'],

	limit: {
		duration: ms('1hour'),
		max: 100,
	},

	requireCredential: true,

	kind: 'write:blocks',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '7cc4f851-e2f1-4621-9633-ec9e1d00c01e',
		},

		blockeeIsYourself: {
			message: 'Blockee is yourself.',
			code: 'BLOCKEE_IS_YOURSELF',
			id: '88b19138-f28d-42c0-8499-6a31bbd0fdc6',
		},

		alreadyBlocking: {
			message: 'You are already blocking that user.',
			code: 'ALREADY_BLOCKING',
			id: '787fed64-acb9-464a-82eb-afbd745b9614',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserDetailedNotMe',
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
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private userEntityService: UserEntityService,
		private getterService: GetterService,
		private userBlockingService: UserBlockingService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const blocker = await this.usersRepository.findOneByOrFail({ id: me.id });

			// 自分自身
			if (me.id === ps.userId) {
				throw new ApiError(meta.errors.blockeeIsYourself);
			}

			// Get blockee
			const blockee = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			// Check if already blocking
			const exist = await this.blockingsRepository.findOneBy({
				blockerId: blocker.id,
				blockeeId: blockee.id,
			});

			if (exist != null) {
				throw new ApiError(meta.errors.alreadyBlocking);
			}

			await this.userBlockingService.block(blocker, blockee);

			return await this.userEntityService.pack(blockee.id, blocker, {
				detail: true,
			});
		});
	}
}
