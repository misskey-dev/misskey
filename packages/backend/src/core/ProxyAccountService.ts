/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { MiMeta, UsersRepository } from '@/models/_.js';
import type { MiLocalUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class ProxyAccountService {
	constructor(
		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
	) {
	}

	@bindThis
	public async fetch(): Promise<MiLocalUser | null> {
		if (this.meta.proxyAccountId == null) return null;
		return await this.usersRepository.findOneByOrFail({ id: this.meta.proxyAccountId }) as MiLocalUser;
	}
}
