/**
 * Module dependencies
 */
import $ from 'cafy';
import App, { pack } from '../../../../models/app';

/**
 * Get my apps
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional().range(1, 100).get(params.limit);
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $.num.optional().min(0).get(params.offset);
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
