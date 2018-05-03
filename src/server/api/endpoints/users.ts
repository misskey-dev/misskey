/**
 * Module dependencies
 */
import $ from 'cafy';
import User, { pack } from '../../../models/user';

/**
 * Lists all users
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional().range(1, 100).get(params.limit);
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $.num.optional().min(0).get(params.offset);
	if (offsetErr) return rej('invalid offset param');

	// Get 'sort' parameter
	const [sort, sortError] = $.str.optional().or('+follower|-follower').get(params.sort);
	if (sortError) return rej('invalid sort param');

	// Construct query
	let _sort;
	if (sort) {
		if (sort == '+follower') {
			_sort = {
				followersCount: -1
			};
		} else if (sort == '-follower') {
			_sort = {
				followersCount: 1
			};
		}
	} else {
		_sort = {
			_id: -1
		};
	}

	// Issue query
	const users = await User
		.find({
			host: null
		}, {
			limit: limit,
			sort: _sort,
			skip: offset
		});

	// Serialize
	res(await Promise.all(users.map(async user =>
		await pack(user, me))));
});
