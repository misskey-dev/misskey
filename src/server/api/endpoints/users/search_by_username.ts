/**
 * Module dependencies
 */
import $ from 'cafy';
import User, { pack } from '../../../../models/user';

/**
 * Search a user by username
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'query' parameter
	const [query, queryError] = $.str.get(params.query);
	if (queryError) return rej('invalid query param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $.num.optional().min(0).get(params.offset);
	if (offsetErr) return rej('invalid offset param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional().range(1, 100).get(params.limit);
	if (limitErr) return rej('invalid limit param');

	let users = await User
		.find({
			host: null,
			usernameLower: new RegExp(query.toLowerCase())
		}, {
			limit: limit,
			skip: offset
		});

	if (users.length < limit) {
		const remoteUsers = await User
			.find({
				host: { $ne: null },
				usernameLower: new RegExp(query.toLowerCase())
			}, {
				limit: limit - users.length
			});

		users = users.concat(remoteUsers);
	}

	// Serialize
	res(await Promise.all(users.map(user => pack(user, me, { detail: true }))));
});
