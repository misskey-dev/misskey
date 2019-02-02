import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Notification from '../../../../models/notification';
import { packMany } from '../../../../models/notification';
import { getFriendIds } from '../../common/get-friends';
import read from '../../common/read-notification';
import define from '../../define';
import { getHideUserIds } from '../../common/get-hide-users';

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

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Check if both of sinceId and untilId is specified
	if (ps.sinceId && ps.untilId) {
		return rej('cannot set sinceId and untilId');
	}

	const hideUserIds = await getHideUserIds(user);

	const query = {
		notifieeId: user._id,
		$and: [{
			notifierId: {
				$nin: hideUserIds
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

	if (ps.includeTypes.length > 0) {
		query.type = {
			$in: ps.includeTypes
		};
	} else if (ps.excludeTypes.length > 0) {
		query.type = {
			$nin: ps.excludeTypes
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
}));
