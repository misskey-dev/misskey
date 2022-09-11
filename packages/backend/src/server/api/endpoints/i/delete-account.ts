import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import { UserProfiles, Users } from '@/models/index.js';
import { deleteAccount } from '@/services/delete-account.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string' },
	},
	required: ['password'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
    private usersRepository: typeof Users,

		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
			const profile = await UserProfiles.findOneByOrFail({ userId: user.id });
			const userDetailed = await this.usersRepository.findOneByOrFail({ id: user.id });
			if (userDetailed.isDeleted) {
				return;
			}

			// Compare password
			const same = await bcrypt.compare(ps.password, profile.password!);

			if (!same) {
				throw new Error('incorrect password');
			}

			await deleteAccount(user);
		});
	}
}
