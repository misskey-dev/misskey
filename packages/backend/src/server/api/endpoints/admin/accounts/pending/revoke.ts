import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type { UserPendingsRepository } from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:account',

	errors: {
		pendingUserNotFound: {
			message: 'Pending User not found.',
			code: 'PENDING_USER_NOT_FOUND',
			id: 'a04d6118-65e6-4508-9144-9900a331bbf3',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
		code: { type: 'string' },
	},
	anyOf: [
		{ required: ['id'] },
		{ required: ['code'] },
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userPendingsRepository)
		private userPendingsRepository: UserPendingsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const pendingUser = await this.userPendingsRepository.findOneBy({ id: ps.id, code: ps.code });

			if (pendingUser == null) throw new ApiError(meta.errors.pendingUserNotFound);

			await this.userPendingsRepository.delete(pendingUser.id);
		});
	}
}
