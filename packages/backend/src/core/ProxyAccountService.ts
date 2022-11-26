import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from '@/models/index.js';
import type { ILocalUser, User } from '@/models/entities/User.js';
import { DI } from '@/di-symbols.js';
import { MetaService } from './MetaService.js';

@Injectable()
export class ProxyAccountService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private metaService: MetaService,
	) {
	}

	public async fetch(): Promise<ILocalUser | null> {
		const meta = await this.metaService.fetch();
		if (meta.proxyAccountId == null) return null;
		return await this.usersRepository.findOneByOrFail({ id: meta.proxyAccountId }) as ILocalUser;
	}
}
