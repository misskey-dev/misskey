import $ from 'cafy';
import UserList, { pack } from '../../../../../models/user-list';
import { ILocalUser } from '../../../../../models/user';

/**
 * Create a user list
 */
export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'title' parameter
	const [title, titleErr] = $.str.range(1, 100).get(params.title);
	if (titleErr) return rej('invalid title param');

	// insert
	const userList = await UserList.insert({
		createdAt: new Date(),
		userId: user._id,
		title: title,
		userIds: []
	});

	// Response
	res(await pack(userList));
});
