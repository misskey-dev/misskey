import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import type { ILocalUser } from '@/models/entities/User.js';
import type { UsersRepository } from '@/models/index.js';
import { Cache } from '@/misc/cache.js';
import { DI } from '@/di-symbols.js';
import { CreateSystemUserService } from './CreateSystemUserService.js';

const ACTOR_USERNAME = 'instance.actor' as const;

@Injectable()
export class InstanceActorService {
	private cache: Cache<ILocalUser>;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private createSystemUserService: CreateSystemUserService,
	) {
		this.cache = new Cache<ILocalUser>(Infinity);
	}

	public async getInstanceActor(): Promise<ILocalUser> {
		const cached = this.cache.get(null);
		if (cached) return cached;
	
		const user = await this.usersRepository.findOneBy({
			host: IsNull(),
			username: ACTOR_USERNAME,
		}) as ILocalUser | undefined;
	
		if (user) {
			this.cache.set(null, user);
			return user;
		} else {
			const created = await this.createSystemUserService.createSystemUser(ACTOR_USERNAME) as ILocalUser;
			this.cache.set(null, created);
			return created;
		}
	}
}
