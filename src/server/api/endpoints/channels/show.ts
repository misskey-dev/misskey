/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import Channel, { IChannel, pack } from '../../../../models/channel';

/**
 * Show a channel
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'channelId' parameter
	const [channelId, channelIdErr] = $(params.channelId).type(ID).$;
	if (channelIdErr) return rej('invalid channelId param');

	// Fetch channel
	const channel: IChannel = await Channel.findOne({
		_id: channelId
	});

	if (channel === null) {
		return rej('channel not found');
	}

	// Serialize
	res(await pack(channel, user));
});
