import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { AccessTokens, Apps } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { App } from '@/models/entities/App.js';
import type { User } from '@/models/entities/User.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class AppEntityService {
	constructor(
		@Inject(DI.appsRepository)
		private appsRepository: typeof Apps,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: typeof AccessTokens,
	) {
	}

	public async pack(
		src: App['id'] | App,
		me?: { id: User['id'] } | null | undefined,
		options?: {
			detail?: boolean,
			includeSecret?: boolean,
			includeProfileImageIds?: boolean
		},
	): Promise<Packed<'App'>> {
		const opts = Object.assign({
			detail: false,
			includeSecret: false,
			includeProfileImageIds: false,
		}, options);

		const app = typeof src === 'object' ? src : await this.appsRepository.findOneByOrFail({ id: src });

		return {
			id: app.id,
			name: app.name,
			callbackUrl: app.callbackUrl,
			permission: app.permission,
			...(opts.includeSecret ? { secret: app.secret } : {}),
			...(me ? {
				isAuthorized: await this.accessTokensRepository.countBy({
					appId: app.id,
					userId: me.id,
				}).then(count => count > 0),
			} : {}),
		};
	}
}
