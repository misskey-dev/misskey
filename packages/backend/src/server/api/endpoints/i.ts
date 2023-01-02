import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';

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
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, user, token) => {
			const isSecure = token == null;

			// ここで渡ってきている user はキャッシュされていて古い可能性もあるので id だけ渡す
			return await this.userEntityService.pack<true, true>(user.id, user, {
				detail: true,
				includeSecrets: isSecure,
			});
		});
	}
}
