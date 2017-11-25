/**
 * Module dependencies
 */
import $ from 'cafy';
import { default as Channel, IChannel } from '../../models/channel';
import Post from '../../models/post';
import serialize from '../../serializers/post';

/**
 * Show a posts of a channel
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 1000, limitErr] = $(params.limit).optional.number().range(1, 1000).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'since_id' parameter
	const [sinceId, sinceIdErr] = $(params.since_id).optional.id().$;
	if (sinceIdErr) return rej('invalid since_id param');

	// Get 'max_id' parameter
	const [maxId, maxIdErr] = $(params.max_id).optional.id().$;
	if (maxIdErr) return rej('invalid max_id param');

	// Check if both of since_id and max_id is specified
	if (sinceId && maxId) {
		return rej('cannot set since_id and max_id');
	}

	// Get 'channel_id' parameter
	const [channelId, channelIdErr] = $(params.channel_id).id().$;
	if (channelIdErr) return rej('invalid channel_id param');

	// Fetch channel
	const channel: IChannel = await Channel.findOne({
		_id: channelId
	});

	if (channel === null) {
		return rej('channel not found');
	}

	//#region Construct query
	const sort = {
		_id: -1
	};

	const query = {
		channel_id: channel._id
	} as any;

	if (sinceId) {
		sort._id = 1;
		query._id = {
			$gt: sinceId
		};
	} else if (maxId) {
		query._id = {
			$lt: maxId
		};
	}
	//#endregion Construct query

	// Issue query
	const posts = await Post
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(posts.map(async (post) =>
		await serialize(post, user)
	)));
});
