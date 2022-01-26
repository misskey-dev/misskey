import $ from 'cafy';
import define from '../../define';
import { Apps } from '@/models/index';

export const meta = {
	tags: ['account', 'app'],

	requireCredential: true,

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
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
				},
				name: {
					type: 'string',
					optional: false, nullable: false,
				},
				callbackUrl: {
					type: 'string',
					optional: false, nullable: false,
				},
				permission: {
					type: 'array',
					optional: false, nullable: false,
					items: {
						type: 'string',
						optional: false, nullable: false,
					},
				},
				secret: {
					type: 'string',
					optional: true, nullable: false,
				},
				isAuthorized: {
					type: 'object',
					optional: true, nullable: false,
					properties: {
						appId: {
							type: 'string',
							optional: false, nullable: false,
						},
						userId: {
							type: 'string',
							optional: false, nullable: false,
						},
					},
				},
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
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
