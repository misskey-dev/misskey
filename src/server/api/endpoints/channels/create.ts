/**
 * Module dependencies
 */
import $ from 'cafy';
import Channel from '../../../../models/channel';
import Watching from '../../../../models/channel-watching';
import { pack } from '../../../../models/channel';

/**
 * Create a channel
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
	// Get 'title' parameter
	const [title, titleErr] = $.str.range(1, 100).get(params.title);
	if (titleErr) return rej('invalid title param');

	// Create a channel
	const channel = await Channel.insert({
		createdAt: new Date(),
		userId: user._id,
		title: title,
		index: 0,
		watchingCount: 1
	});

	// Response
	res(await pack(channel));

	// Create Watching
	await Watching.insert({
		createdAt: new Date(),
		userId: user._id,
		channelId: channel._id
	});
});
