import $ from 'cafy';
import define from '../../define';
import { Apps } from '@/models/index';

export const meta = {
	tags: ['account', 'app'],

	requireCredential: true as const,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0,
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
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
					optional: false as const, nullable: false as const,
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
					type: 'object' as const,
					optional: true as const, nullable: false as const,
					properties: {
						appId: {
							type: 'string' as const,
							optional: false as const, nullable: false as const,
						},
						userId: {
							type: 'string' as const,
							optional: false as const, nullable: false as const,
						},
					},
				},
			},
		},
	},
};

export default define(meta, async (ps, user) => {
	const query = {
		userId: user.id,
	};

	const apps = await Apps.find({
		where: query,
		take: ps.limit!,
		skip: ps.offset,
	});

	return await Promise.all(apps.map(app => Apps.pack(app, user, {
		detail: true,
	})));
});
