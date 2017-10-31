/**
 * Module dependencies
 */
import $ from 'cafy';
import Channel from '../../models/channel';
import serialize from '../../serializers/channel';

/**
 * Create a channel
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
	// Get 'title' parameter
	const [title, titleErr] = $(params.title).string().range(1, 100).$;
	if (titleErr) return rej('invalid title param');

	// Create a channel
	const channel = await Channel.insert({
		created_at: new Date(),
		user_id: user._id,
		title: title
	});

	// Response
	res(await serialize(channel));
});
