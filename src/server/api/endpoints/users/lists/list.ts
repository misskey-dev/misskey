import define from '../../../define';
import { UserLists } from '@/models/index';

export const meta = {
	tags: ['lists', 'account'],

	requireCredential: true as const,

	kind: 'read:account',

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'UserList',
		}
	},
};

export default define(meta, async (ps, me) => {
	const userLists = await UserLists.find({
		userId: me.id,
	});

	return await Promise.all(userLists.map(x => UserLists.pack(x)));
});
