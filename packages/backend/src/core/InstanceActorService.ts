import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import type { LocalUser } from '@/models/entities/User.js';
import type { UsersRepository } from '@/models/index.js';
import { Cache } from '@/misc/cache.js';
import { DI } from '@/di-symbols.js';
import { CreateSystemUserService } from '@/core/CreateSystemUserService.js';
import { bindThis } from '@/decorators.js';

const ACTOR_USERNAME = 'instance.actor' as const;

@Injectable()
export class InstanceActorService {
	private cache: Cache<LocalUser>;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private createSystemUserService: CreateSystemUserService,
	) {
		this.cache = new Cache<LocalUser>(Infinity);
	}

	@bindThis
	public async getInstanceActor(): Promise<LocalUser> {
		const cached = this.cache.get(null);
		if (cached) return cached;
	
		const user = await this.usersRepository.findOneBy({
			host: IsNull(),
			username: ACTOR_USERNAME,
		}) as LocalUser | undefined;
	
		if (user) {
			this.cache.set(null, user);
			return user;
		} else {
			const created = await this.createSystemUserService.createSystemUser(ACTOR_USERNAME) as LocalUser;
			this.cache.set(null, created);
			return created;
		}
	}
}
