/**
 * Module dependencies
 */
import $ from 'cafy';
import Channel, { pack } from '../models/channel';

/**
 * Get all channels
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'since_id' parameter
	const [sinceId, sinceIdErr] = $(params.since_id).optional.id().$;
	if (sinceIdErr) return rej('invalid since_id param');

	// Get 'until_id' parameter
	const [untilId, untilIdErr] = $(params.until_id).optional.id().$;
	if (untilIdErr) return rej('invalid until_id param');

	// Check if both of since_id and until_id is specified
	if (sinceId && untilId) {
		return rej('cannot set since_id and until_id');
	}

	// Construct query
	const sort = {
		_id: -1
	};
	const query = {} as any;
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
	const channels = await Channel
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(channels.map(async channel =>
		await pack(channel, me))));
});
