import $ from 'cafy'; import ID from '../../../../../cafy-id';
import UserList, { pack } from '../../../../../models/user-list';

/**
 * Show a user list
 */
module.exports = async (params, me) => new Promise(async (res, rej) => {
	// Get 'listId' parameter
	const [listId, listIdErr] = $(params.listId).type(ID).get();
	if (listIdErr) return rej('invalid listId param');

	// Fetch the list
	const userList = await UserList.findOne({
		_id: listId,
		userId: me._id,
	});

	if (userList == null) {
		return rej('list not found');
	}

	res(await pack(userList));
});
