import { Inject, Injectable } from '@nestjs/common';
import { Users } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'MeDetailed',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
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
		super(meta, paramDef, async (ps, user, token) => {
			const isSecure = token == null;

			// ここで渡ってきている user はキャッシュされていて古い可能性もあるので id だけ渡す
			return await Users.pack<true, true>(user.id, user, {
				detail: true,
				includeSecrets: isSecure,
			});
		});
	}
}
