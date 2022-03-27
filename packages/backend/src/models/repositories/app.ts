import { db } from '@/db/postgre.js';
import { App } from '@/models/entities/app.js';
import { AccessTokens } from '../index.js';
import { Packed } from '@/misc/schema.js';
import { User } from '../entities/user.js';

export const AppRepository = db.getRepository(App).extend({
	async pack(
		src: App['id'] | App,
		me?: { id: User['id'] } | null | undefined,
		options?: {
			detail?: boolean,
			includeSecret?: boolean,
			includeProfileImageIds?: boolean
		}
	): Promise<Packed<'App'>> {
		const opts = Object.assign({
			detail: false,
			includeSecret: false,
			includeProfileImageIds: false,
		}, options);

		const app = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		return {
			id: app.id,
			name: app.name,
			callbackUrl: app.callbackUrl,
			permission: app.permission,
			...(opts.includeSecret ? { secret: app.secret } : {}),
			...(me ? {
				isAuthorized: await AccessTokens.countBy({
					appId: app.id,
					userId: me.id,
				}).then(count => count > 0),
			} : {}),
		};
	},
});
