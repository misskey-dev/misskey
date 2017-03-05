/**
 * Module dependencies
 */
import it from 'cafy';
import User from '../../models/user';
import { validateUsername } from '../../models/user';
import serialize from '../../serializers/user';

/**
 * Search a user by username
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'query' parameter
	const [query, queryError] = it(params.query).expect.string().required().trim().validate(validateUsername).get();
	if (queryError) return rej('invalid query param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = it(params.offset).expect.number().min(0).get();
	if (offsetErr) return rej('invalid offset param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = it(params.limit).expect.number().range(1, 100).get();
	if (limitErr) return rej('invalid limit param');

	const users = await User
		.find({
			username_lower: new RegExp(query.toLowerCase())
		}, {
			limit: limit,
			skip: offset
		});

	// Serialize
	res(await Promise.all(users.map(async user =>
		await serialize(user, me, { detail: true }))));
});
