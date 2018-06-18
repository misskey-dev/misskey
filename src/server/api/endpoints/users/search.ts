import $ from 'cafy';
import User, { pack, ILocalUser } from '../../../../models/user';
const escapeRegexp = require('escape-regexp');

/**
 * Search a user
 */
module.exports = (params: any, me: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'query' parameter
	const [query, queryError] = $.str.pipe(x => x != '').get(params.query);
	if (queryError) return rej('invalid query param');

	// Get 'max' parameter
	const [max = 10, maxErr] = $.num.optional().range(1, 30).get(params.max);
	if (maxErr) return rej('invalid max param');

	const escapedQuery = escapeRegexp(query);

	// Search users
	const users = await User
		.find({
			host: null,
			$or: [{
				usernameLower: new RegExp(escapedQuery.replace('@', '').toLowerCase())
			}, {
				name: new RegExp(escapedQuery)
			}]
		}, {
			limit: max
		});

	// Serialize
	res(await Promise.all(users.map(user => pack(user, me, { detail: true }))));
});
