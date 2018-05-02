/**
 * Module dependencies
 */
import $ from 'cafy';
import UserList, { pack } from '../../../../../models/user-list';

/**
 * Create a user list
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
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
