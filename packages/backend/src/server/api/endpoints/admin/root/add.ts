import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { UsersRepository } from '@/models/_.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
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
		@Inject(DI.usersRepository)
		private UsersRepository: UsersRepository,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps) => {
			const user = await this.UsersRepository.findOneBy({ id: ps.userId });

			if (user == null) {
				throw new Error('user not found');
			}

			await this.UsersRepository.update(user.id, {
				isRoot: true,
			});

			this.globalEventService.publishInternalEvent('userChangeRootState', { id: user.id, isRoot: true });
		});
	}
}
