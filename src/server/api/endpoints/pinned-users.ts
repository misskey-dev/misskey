import define from '../define';
import { Users } from '../../../models';
import { types, bool } from '../../../misc/schema';
import { fetchMeta } from '../../../misc/fetch-meta';
import parseAcct from '../../../misc/acct/parse';
import { User } from '../../../models/entities/user';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	params: {
	},

	res: {
		type: types.array,
		optional: bool.false, nullable: bool.false,
		items: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			ref: 'User',
		}
	},
};

export default define(meta, async (ps, me) => {
	const meta = await fetchMeta();

	const users = await Promise.all(meta.pinnedUsers.map(acct => Users.findOne(parseAcct(acct))));

	return await Users.packMany(users.filter(x => x !== undefined) as User[], me, { detail: true });
});
