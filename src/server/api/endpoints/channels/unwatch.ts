/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import Channel from '../../../../models/channel';
import Watching from '../../../../models/channel-watching';

/**
 * Unwatch a channel
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'channelId' parameter
	const [channelId, channelIdErr] = $(params.channelId).type(ID).get();
	if (channelIdErr) return rej('invalid channelId param');

	//#region Fetch channel
	const channel = await Channel.findOne({
		_id: channelId
	});

	if (channel === null) {
		return rej('channel not found');
	}
	//#endregion

	//#region Check whether not watching
	const exist = await Watching.findOne({
		userId: user._id,
		channelId: channel._id,
		deletedAt: { $exists: false }
	});

	if (exist === null) {
		return rej('already not watching');
	}
	//#endregion

	// Delete watching
	await Watching.update({
		_id: exist._id
	}, {
		$set: {
			deletedAt: new Date()
		}
	});

	// Send response
	res();

	// Decrement watching count
	Channel.update(channel._id, {
		$inc: {
			watchingCount: -1
		}
	});
});
