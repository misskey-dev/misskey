/**
 * Module dependencies
 */
import $ from 'cafy';
import Thread from '../../../models/bbs-thread';
import serialize from '../../../serializers/bbs-thread';

/**
 * Create a thread
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
	// Get 'title' parameter
	const [title, titleErr] = $(params.title).string().range(1, 100).$;
	if (titleErr) return rej('invalid title param');

	// Create a thread
	const thread = await Thread.insert({
		created_at: new Date(),
		user_id: user._id,
		title: title
	});

	// Response
	res(await serialize(thread));
});
