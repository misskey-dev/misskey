import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Notification from '../../../../models/notification';
import Mute from '../../../../models/mute';
import { packMany } from '../../../../models/notification';
import { getFriendIds } from '../../common/get-friends';
import read from '../../common/read-notification';
import define from '../../define';
import { errorWhen } from '../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '通知一覧を取得します。',
		'en-US': 'Get notifications.'
	},

	requireCredential: true,

	kind: 'account-read',

	params: {
		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		untilId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		following: {
			validator: $.bool.optional,
			default: false
		},

		markAsRead: {
			validator: $.bool.optional,
			default: true
		},

		includeTypes: {
			validator: $.arr($.str.or(['follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'poll_vote', 'receiveFollowRequest'])).optional,
			default: [] as string[]
		},

		excludeTypes: {
			validator: $.arr($.str.or(['follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'poll_vote', 'receiveFollowRequest'])).optional,
			default: [] as string[]
		}
	}
};

export default define(meta, (ps, user) => errorWhen(
	ps.sinceId && !!ps.untilId,
	'cannot set sinceId and untilId')
	.then(() => Mute.find({ muterId: user._id }))
	.then(async x => Notification.find({
			_id:
				ps.sinceId ? { $gt: ps.sinceId } :
				ps.untilId ? { $lt: ps.untilId } : undefined,
			notifieeId: user._id,
			$and: [{
				notifierId: { $nin: x.map(m => m.muteeId) }
			}, ...(ps.following ? [{
				notifierId: { $in: await getFriendIds(user._id) }
			}] : [])],
			type:
				ps.includeTypes.length ? { $in: ps.includeTypes } :
				ps.excludeTypes.length ? { $nin: ps.excludeTypes } : undefined
		}, {
			limit: ps.limit,
			sort: { _id: ps.sinceId ? 1 : -1 }
		}))
	.then(packMany)
	.then(x => (x.length && ps.markAsRead && read(user._id, x), x)));
