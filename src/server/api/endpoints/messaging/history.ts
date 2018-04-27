/**
 * Module dependencies
 */
import $ from 'cafy';
import History from '../../../../models/messaging-history';
import Mute from '../../../../models/mute';
import { pack } from '../../../../models/messaging-message';

/**
 * Show messaging history
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).get();
	if (limitErr) return rej('invalid limit param');

	const mute = await Mute.find({
		muterId: user._id,
		deletedAt: { $exists: false }
	});

	// Get history
	const history = await History
		.find({
			userId: user._id,
			partnerId: {
				$nin: mute.map(m => m.muteeId)
			}
		}, {
			limit: limit,
			sort: {
				updatedAt: -1
			}
		});

	// Serialize
	res(await Promise.all(history.map(async h =>
		await pack(h.messageId, user))));
});
