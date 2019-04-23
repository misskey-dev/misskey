import { EntityRepository, Repository } from 'typeorm';
import { App } from '../entities/app';
import { AccessTokens } from '..';
import { ensure } from '../../prelude/ensure';
import { types, bool, SchemaType } from '../../misc/schema';

export type PackedApp = SchemaType<typeof packedAppSchema>;

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
	): Promise<PackedApp> {
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
			permission: app.permission,
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

export const packedAppSchema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		id: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
			description: 'The unique identifier for this Note.',
			example: 'xxxxxxxxxx',
		},
		name: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			description: 'アプリケーションの名前'
		},
		callbackUrl: {
			type: types.string,
			optional: bool.false, nullable: bool.true,
			description: 'コールバックするURL'
		},
		permission: {
			type: types.array,
			optional: bool.true, nullable: bool.false,
			items: {
				type: types.string,
				optional: bool.false, nullable: bool.false,
			}
		},
		secret: {
			type: types.string,
			optional: bool.true, nullable: bool.false,
			description: 'アプリケーションのシークレットキー'
		}
	},
};
