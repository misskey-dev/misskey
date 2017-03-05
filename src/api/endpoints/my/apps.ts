/**
 * Module dependencies
 */
import it from 'cafy';
import App from '../../models/app';
import serialize from '../../serializers/app';

/**
 * Get my apps
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = it(params.limit).expect.number().range(1, 100).get();
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = it(params.offset).expect.number().min(0).get();
	if (offsetErr) return rej('invalid offset param');

	const query = {
		user_id: user._id
	};

	// Execute query
	const apps = await App
		.find(query, {
			limit: limit,
			skip: offset,
			sort: {
				_id: -1
			}
		});

	// Reply
	res(await Promise.all(apps.map(async app =>
		await serialize(app))));
});
