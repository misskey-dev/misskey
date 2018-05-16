/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import { default as Channel, IChannel } from '../../../../models/channel';
import Note, { pack } from '../../../../models/note';

/**
 * Show a notes of a channel
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 1000, limitErr] = $.num.optional().range(1, 1000).get(params.limit);
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

	// Get 'channelId' parameter
	const [channelId, channelIdErr] = $.type(ID).get(params.channelId);
	if (channelIdErr) return rej('invalid channelId param');

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
		channelId: channel._id
	} as any;

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
	//#endregion Construct query

	// Issue query
	const notes = await Note
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(notes.map(async (note) =>
		await pack(note, user)
	)));
});
