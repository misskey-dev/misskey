import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { AuthSessionsRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { AuthSession } from '@/models/entities/AuthSession.js';
import type { User } from '@/models/entities/User.js';
import { AppEntityService } from './AppEntityService.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class AuthSessionEntityService {
	constructor(
		@Inject(DI.authSessionsRepository)
		private authSessionsRepository: AuthSessionsRepository,

		private appEntityService: AppEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: AuthSession['id'] | AuthSession,
		me?: { id: User['id'] } | null | undefined,
	) {
		const session = typeof src === 'object' ? src : await this.authSessionsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: session.id,
			app: this.appEntityService.pack(session.appId, me),
			token: session.token,
		});
	}
}
