import { Inject, Injectable } from '@nestjs/common';
import type { Users } from '@/models/index.js';
import { deleteAccount } from '@/services/delete-account.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,

	res: {
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
		@Inject('usersRepository')
    private usersRepository: typeof Users,
	) {
		super(meta, paramDef, async (ps) => {
			const user = await this.usersRepository.findOneByOrFail({ id: ps.userId });
			if (user.isDeleted) {
				return;
			}

			await deleteAccount(user);
		});
	}
}
