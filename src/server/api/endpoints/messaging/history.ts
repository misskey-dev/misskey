import $ from 'cafy';
import History from '../../../../models/messaging-history';
import Mute from '../../../../models/mute';
import { pack } from '../../../../models/messaging-message';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	desc: {
		'ja-JP': 'Messagingの履歴を取得します。',
		'en-US': 'Show messaging history.'
	},

	requireCredential: true,

	kind: 'messaging-read',

	params: {
		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		}
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

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
			limit: ps.limit,
			sort: {
				updatedAt: -1
			}
		});

	res(await Promise.all(history.map(h => pack(h.messageId, user))));
});
