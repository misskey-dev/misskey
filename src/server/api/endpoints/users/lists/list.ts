import UserList, { pack } from '../../../../../models/user-list';
import { ILocalUser } from '../../../../../models/user';

/**
 * Add a user to a user list
 */
module.exports = async (params: any, me: ILocalUser) => new Promise(async (res, rej) => {
	// Fetch lists
	const userLists = await UserList.find({
		userId: me._id,
	});

	res(await Promise.all(userLists.map(x => pack(x))));
});
