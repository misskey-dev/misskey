import { EntityRepository, Repository } from 'typeorm';
import { App } from '@/models/entities/app';
import { AccessTokens } from '../index';
import { Packed } from '@/misc/schema';
import { User } from '../entities/user';

@EntityRepository(App)
export class AppRepository extends Repository<App> {
	public async pack(
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
				}).then(count => count > 0),
			} : {}),
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
		},
		name: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		callbackUrl: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
		},
		permission: {
			type: 'array' as const,
			optional: false as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			},
		},
		secret: {
			type: 'string' as const,
			optional: true as const, nullable: false as const,
		},
		isAuthorized: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
	},
};
