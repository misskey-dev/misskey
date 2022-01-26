import define from '../../../define';
import { UserLists } from '@/models/index';

export const meta = {
	tags: ['lists', 'account'],

	requireCredential: true,

	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserList',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const userLists = await UserLists.find({
		userId: me.id,
	});

	return await Promise.all(userLists.map(x => UserLists.pack(x)));
});
