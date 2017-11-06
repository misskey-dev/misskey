/**
 * Module dependencies
 */
import $ from 'cafy';
import Channel from '../../models/channel';
import Watching from '../../models/channel-watching';

/**
 * Unwatch a channel
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'channel_id' parameter
	const [channelId, channelIdErr] = $(params.channel_id).id().$;
	if (channelIdErr) return rej('invalid channel_id param');

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
		user_id: user._id,
		channel_id: channel._id,
		deleted_at: { $exists: false }
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
			deleted_at: new Date()
		}
	});

	// Send response
	res();

	// Decrement watching count
	Channel.update(channel._id, {
		$inc: {
			watching_count: -1
		}
	});
});
