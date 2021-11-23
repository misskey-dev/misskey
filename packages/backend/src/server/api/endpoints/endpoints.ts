import define from '../define';
import endpoints from '../endpoints';

export const meta = {
	requireCredential: false as const,

	tags: ['meta'],

	params: {
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'string' as const,
			optional: false as const, nullable: false as const
		},
		example: [
			'admin/abuse-user-reports',
			'admin/accounts/create',
			'admin/announcements/create',
			'...'
		]
	}
};

export default define(meta, async () => {
	return endpoints.map(x => x.name);
});
