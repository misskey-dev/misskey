/**
 * Module dependencies
 */
import $ from 'cafy';
import App, { pack } from '../../models/app';

/**
 * Get my apps
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $(params.offset).optional.number().min(0).$;
	if (offsetErr) return rej('invalid offset param');

	const query = {
		userId: user._id
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
		await pack(app))));
});
