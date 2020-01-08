import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import { readNotification } from '../../common/read-notification';
import define from '../../define';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { Notifications, Followings, Mutings, Users } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': '通知一覧を取得します。',
		'en-US': 'Get notifications.'
	},

	tags: ['account', 'notifications'],

	requireCredential: true,

	kind: 'read:notifications',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		following: {
			validator: $.optional.bool,
			default: false
		},

		markAsRead: {
			validator: $.optional.bool,
			default: true
		},

		includeTypes: {
			validator: $.optional.arr($.str.or(['follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest'])),
			default: [] as string[]
		},

		excludeTypes: {
			validator: $.optional.arr($.str.or(['follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest'])),
			default: [] as string[]
		}
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Notification',
		}
	},
};

export default define(meta, async (ps, user) => {
	const followingQuery = Followings.createQueryBuilder('following')
		.select('following.followeeId')
		.where('following.followerId = :followerId', { followerId: user.id });

	const mutingQuery = Mutings.createQueryBuilder('muting')
		.select('muting.muteeId')
		.where('muting.muterId = :muterId', { muterId: user.id });

	const suspendedQuery = Users.createQueryBuilder('users')
		.select('id')
		.where('users.isSuspended = TRUE');

	const query = makePaginationQuery(Notifications.createQueryBuilder('notification'), ps.sinceId, ps.untilId)
		.andWhere(`notification.notifieeId = :meId`, { meId: user.id })
		.leftJoinAndSelect('notification.notifier', 'notifier');

	query.andWhere(`notification.notifierId NOT IN (${ mutingQuery.getQuery() })`);
	query.setParameters(mutingQuery.getParameters());

	query.andWhere(`notification.notifierId NOT IN (${ suspendedQuery.getQuery() })`);

	if (ps.following) {
		query.andWhere(`((notification.notifierId IN (${ followingQuery.getQuery() })) OR (notification.notifierId = :meId))`, { meId: user.id });
		query.setParameters(followingQuery.getParameters());
	}

	if (ps.includeTypes!.length > 0) {
		query.andWhere(`notification.type IN (:...includeTypes)`, { includeTypes: ps.includeTypes });
	} else if (ps.excludeTypes!.length > 0) {
		query.andWhere(`notification.type NOT IN (:...excludeTypes)`, { excludeTypes: ps.excludeTypes });
	}

	const notifications = await query.take(ps.limit!).getMany();

	// Mark all as read
	if (notifications.length > 0 && ps.markAsRead) {
		readNotification(user.id, notifications.map(x => x.id));
	}

	return await Notifications.packMany(notifications);
});
