/**
 * Module dependencies
 */
import $ from 'cafy';
import User, { pack } from '../models/user';

/**
 * Lists all users
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $(params.offset).optional.number().min(0).$;
	if (offsetErr) return rej('invalid offset param');

	// Get 'sort' parameter
	const [sort, sortError] = $(params.sort).optional.string().or('+follower|-follower').$;
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
		.find({}, {
			limit: limit,
			sort: _sort,
			skip: offset
		});

	// Serialize
	res(await Promise.all(users.map(async user =>
		await pack(user, me))));
});
