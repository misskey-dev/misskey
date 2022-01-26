import define from '../define';
import endpoints from '../endpoints';

export const meta = {
	requireCredential: false,

	tags: ['meta'],

	params: {
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'string',
			optional: false, nullable: false,
		},
		example: [
			'admin/abuse-user-reports',
			'admin/accounts/create',
			'admin/announcements/create',
			'...',
		],
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async () => {
	return endpoints.map(x => x.name);
});
