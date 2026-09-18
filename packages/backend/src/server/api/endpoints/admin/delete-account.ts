/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import type { UsersRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DeleteAccountService } from '@/core/DeleteAccountService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:delete-account',
} as const;

export const paramDef = v.object({
	userId: mi.misskeyId(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private deleteAccountService: DeleteAccountService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await this.usersRepository.findOneByOrFail({ id: ps.userId });
			if (user.isDeleted) {
				return;
			}

			await this.deleteAccountService.deleteAccount(user, me);
		});
	}
}
