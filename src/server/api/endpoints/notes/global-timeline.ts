/**
 * Module dependencies
 */
import $ from 'cafy';
import Note from '../../../../models/note';
import Mute from '../../../../models/mute';
import { pack } from '../../../../models/note';

/**
 * Get timeline of global
 */
module.exports = async (params, user, app) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) throw 'invalid limit param';

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $(params.sinceId).optional.id().$;
	if (sinceIdErr) throw 'invalid sinceId param';

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $(params.untilId).optional.id().$;
	if (untilIdErr) throw 'invalid untilId param';

	// Get 'sinceDate' parameter
	const [sinceDate, sinceDateErr] = $(params.sinceDate).optional.number().$;
	if (sinceDateErr) throw 'invalid sinceDate param';

	// Get 'untilDate' parameter
	const [untilDate, untilDateErr] = $(params.untilDate).optional.number().$;
	if (untilDateErr) throw 'invalid untilDate param';

	// Check if only one of sinceId, untilId, sinceDate, untilDate specified
	if ([sinceId, untilId, sinceDate, untilDate].filter(x => x != null).length > 1) {
		throw 'only one of sinceId, untilId, sinceDate, untilDate can be specified';
	}

	// ミュートしているユーザーを取得
	const mutedUserIds = (await Mute.find({
		muterId: user._id
	})).map(m => m.muteeId);

	//#region Construct query
	const sort = {
		_id: -1
	};

	const query = {
		// mute
		userId: {
			$nin: mutedUserIds
		},
		'_reply.userId': {
			$nin: mutedUserIds
		},
		'_renote.userId': {
			$nin: mutedUserIds
		}
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
	} else if (sinceDate) {
		sort._id = 1;
		query.createdAt = {
			$gt: new Date(sinceDate)
		};
	} else if (untilDate) {
		query.createdAt = {
			$lt: new Date(untilDate)
		};
	}
	//#endregion

	// Issue query
	const timeline = await Note
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	return await Promise.all(timeline.map(note => pack(note, user)));
};
