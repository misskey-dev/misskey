import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { Users } from '@/models/index.js';
import { signup } from '../../../common/signup.js';

export const meta = {
	tags: ['admin'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'User',
		properties: {
			token: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		username: Users.localUsernameSchema,
		password: Users.passwordSchema,
	},
	required: ['username', 'password'],
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
		super(meta, paramDef, async (ps, _me) => {
			const me = _me ? await Users.findOneByOrFail({ id: _me.id }) : null;
			const noUsers = (await Users.countBy({
				host: IsNull(),
			})) === 0;
			if (!noUsers && !me?.isAdmin) throw new Error('access denied');

			const { account, secret } = await signup({
				username: ps.username,
				password: ps.password,
			});

			const res = await Users.pack(account, account, {
				detail: true,
				includeSecrets: true,
			});

			(res as any).token = secret;

			return res;
		});
	}
}
