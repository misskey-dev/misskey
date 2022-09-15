import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { Apps } from '@/models/index.js';
import type { AuthSessions } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { AuthSession } from '@/models/entities/auth-session.js';
import type { User } from '@/models/entities/user.js';
import { UserEntityService } from './UserEntityService.js';
import { AppEntityService } from './AppEntityService.js';

@Injectable()
export class AuthSessionEntityService {
	constructor(
		@Inject('authSessionsRepository')
		private authSessionsRepository: typeof AuthSessions,

		private appEntityService: AppEntityService,
	) {
	}

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
