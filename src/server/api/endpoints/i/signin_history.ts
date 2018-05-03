/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import Signin, { pack } from '../../../../models/signin';

/**
 * Get signin history of my account
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional().range(1, 100).get(params.limit);
	if (limitErr) return rej('invalid limit param');

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $.type(ID).optional().get(params.sinceId);
	if (sinceIdErr) return rej('invalid sinceId param');

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $.type(ID).optional().get(params.untilId);
	if (untilIdErr) return rej('invalid untilId param');

	// Check if both of sinceId and untilId is specified
	if (sinceId && untilId) {
		return rej('cannot set sinceId and untilId');
	}

	const query = {
		userId: user._id
	} as any;

	const sort = {
		_id: -1
	};

	if (sinceId) {
		sort._id = 1;
		query._id = {
			$gt: sinceId
		};
	} else if (untilId) {
		query._id = {
			$lt: untilId
		};
	}

	// Issue query
	const history = await Signin
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(history.map(async record =>
		await pack(record))));
});
