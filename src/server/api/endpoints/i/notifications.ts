import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Notification from '../../../../models/notification';
import Mute from '../../../../models/mute';
import { packMany } from '../../../../models/notification';
import { getFriendIds } from '../../common/get-friends';
import read from '../../common/read-notification';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

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
		}
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Check if both of sinceId and untilId is specified
	if (ps.sinceId && ps.untilId) {
		return rej('cannot set sinceId and untilId');
	}

	const mute = await Mute.find({
		muterId: user._id
	});

	const query = {
		notifieeId: user._id,
		$and: [{
			notifierId: {
				$nin: mute.map(m => m.muteeId)
			}
		}]
	} as any;

	const sort = {
		_id: -1
	};

	if (ps.following) {
		// ID list of the user itself and other users who the user follows
		const followingIds = await getFriendIds(user._id);

		query.$and.push({
			notifierId: {
				$in: followingIds
			}
		});
	}

	if (ps.sinceId) {
		sort._id = 1;
		query._id = {
			$gt: ps.sinceId
		};
	} else if (ps.untilId) {
		query._id = {
			$lt: ps.untilId
		};
	}

	const notifications = await Notification
		.find(query, {
			limit: ps.limit,
			sort: sort
		});

	res(await packMany(notifications));

	// Mark all as read
	if (notifications.length > 0 && ps.markAsRead) {
		read(user._id, notifications);
	}
});
