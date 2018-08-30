import $ from 'cafy';
import History from '../../../../models/messaging-history';
import Mute from '../../../../models/mute';
import { pack } from '../../../../models/messaging-message';
import { ILocalUser } from '../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': 'Messagingの履歴を取得します。',
		'en-US': 'Show messaging history.'
	},

	requireCredential: true,

	kind: 'messaging-read'
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional.range(1, 100).get(params.limit);
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
	res(await Promise.all(history.map(h => pack(h.messageId, user))));
});
