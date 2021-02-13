import { EntityRepository, Repository } from 'typeorm';
import { App } from '../entities/app';
import { AccessTokens } from '..';
import { SchemaType } from '../../misc/schema';

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

		const app = typeof src === 'object' ? src : await this.findOneOrFail(src);

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
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			description: 'The unique identifier for this Note.',
			example: 'xxxxxxxxxx',
		},
		name: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			description: 'アプリケーションの名前'
		},
		callbackUrl: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			description: 'コールバックするURL'
		},
		permission: {
			type: 'array' as const,
			optional: true as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			}
		},
		secret: {
			type: 'string' as const,
			optional: true as const, nullable: false as const,
			description: 'アプリケーションのシークレットキー'
		}
	},
};
