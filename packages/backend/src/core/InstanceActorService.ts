/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import type { LocalUser } from '@/models/entities/User.js';
import type { UsersRepository } from '@/models/index.js';
import { MemorySingleCache } from '@/misc/cache.js';
import { DI } from '@/di-symbols.js';
import { CreateSystemUserService } from '@/core/CreateSystemUserService.js';
import { bindThis } from '@/decorators.js';

const ACTOR_USERNAME = 'instance.actor' as const;

@Injectable()
export class InstanceActorService {
	private cache: MemorySingleCache<LocalUser>;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private createSystemUserService: CreateSystemUserService,
	) {
		this.cache = new MemorySingleCache<LocalUser>(Infinity);
	}

	@bindThis
	public async getInstanceActor(): Promise<LocalUser> {
		const cached = this.cache.get();
		if (cached) return cached;

		const user = await this.usersRepository.findOneBy({
			host: IsNull(),
			username: ACTOR_USERNAME,
		}) as LocalUser | undefined;

		if (user) {
			this.cache.set(user);
			return user;
		} else {
			const created = await this.createSystemUserService.createSystemUser(ACTOR_USERNAME) as LocalUser;
			this.cache.set(created);
			return created;
		}
	}
}
