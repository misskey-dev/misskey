import { EntityRepository, Repository } from 'typeorm';
import { App } from '../entities/app';
import { AccessTokens } from '..';
import { ensure } from '../../prelude/ensure';

@EntityRepository(App)
export class AppRepository extends Repository<App> {
	public async pack(
		src: App['id'] | App,
		me?: any,
		options?: {
			detail?: boolean,
			includeSecret?: boolean,
			includeProfileImageIds?: boolean
		}
	) {
		const opts = Object.assign({
			detail: false,
			includeSecret: false,
			includeProfileImageIds: false
		}, options);

		const app = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return {
			id: app.id,
			name: app.name,
			callbackUrl: app.callbackUrl,
			...(opts.includeSecret ? { secret: app.secret } : {}),
			...(me ? {
				isAuthorized: await AccessTokens.count({
					appId: app.id,
					userId: me,
				}).then(count => count > 0)
			} : {})
		};
	}
}
