/**
 * Module dependencies
 */
import $ from 'cafy';
import Channel, { IChannel, pack } from '../../../../models/channel';

/**
 * Show a channel
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'channelId' parameter
	const [channelId, channelIdErr] = $(params.channelId).id().$;
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
