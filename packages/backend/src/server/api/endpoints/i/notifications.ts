import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import { readNotification } from '../../common/read-notification';
import define from '../../define';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { generateMutedInstanceNotificationQuery } from '../../common/generate-muted-instance-query';
import { Notifications, Followings, Mutings, Users } from '@/models/index';
import { notificationTypes } from '@/types';
import read from '@/services/note/read';
import { Brackets } from 'typeorm';

export const meta = {
	tags: ['account', 'notifications'],

	requireCredential: true as const,

	kind: 'read:notifications',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		following: {
			validator: $.optional.bool,
			default: false,
		},

		unreadOnly: {
			validator: $.optional.bool,
			default: false,
		},

		markAsRead: {
			validator: $.optional.bool,
			default: true,
		},

		includeTypes: {
			validator: $.optional.arr($.str.or(notificationTypes as unknown as string[])),
		},

		excludeTypes: {
			validator: $.optional.arr($.str.or(notificationTypes as unknown as string[])),
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Notification',
		},
	},
};

export default define(meta, async (ps, user) => {
	// includeTypes が空の場合はクエリしない
	if (ps.includeTypes && ps.includeTypes.length === 0) {
		return [];
	}
	// excludeTypes に全指定されている場合はクエリしない
	if (notificationTypes.every(type => ps.excludeTypes?.includes(type))) {
		return [];
	}
	const followingQuery = Followings.createQueryBuilder('following')
		.select('following.followeeId')
		.where('following.followerId = :followerId', { followerId: user.id });

	const mutingQuery = Mutings.createQueryBuilder('muting')
		.select('muting.muteeId')
		.where('muting.muterId = :muterId', { muterId: user.id });

	const suspendedQuery = Users.createQueryBuilder('users')
		.select('users.id')
		.where('users.isSuspended = TRUE');

	const query = makePaginationQuery(Notifications.createQueryBuilder('notification'), ps.sinceId, ps.untilId)
		.andWhere(`notification.notifieeId = :meId`, { meId: user.id })
		.leftJoinAndSelect('notification.notifier', 'notifier')
		.leftJoinAndSelect('notification.note', 'note')
		.leftJoinAndSelect('note.user', 'user')
		.leftJoinAndSelect('note.reply', 'reply')
		.leftJoinAndSelect('note.renote', 'renote')
		.leftJoinAndSelect('reply.user', 'replyUser')
		.leftJoinAndSelect('renote.user', 'renoteUser');

	query.andWhere(new Brackets(qb => { qb
		.where(`notification.notifierId NOT IN (${ mutingQuery.getQuery() })`)
		.orWhere('notification.notifierId IS NULL');
	}));
	query.setParameters(mutingQuery.getParameters());

	generateMutedInstanceNotificationQuery(query, user);

	query.andWhere(new Brackets(qb => { qb
		.where(`notification.notifierId NOT IN (${ suspendedQuery.getQuery() })`)
		.orWhere('notification.notifierId IS NULL');
	}));

	if (ps.following) {
		query.andWhere(`((notification.notifierId IN (${ followingQuery.getQuery() })) OR (notification.notifierId = :meId))`, { meId: user.id });
		query.setParameters(followingQuery.getParameters());
	}

	if (ps.includeTypes && ps.includeTypes.length > 0) {
		query.andWhere(`notification.type IN (:...includeTypes)`, { includeTypes: ps.includeTypes });
	} else if (ps.excludeTypes && ps.excludeTypes.length > 0) {
		query.andWhere(`notification.type NOT IN (:...excludeTypes)`, { excludeTypes: ps.excludeTypes });
	}

	if (ps.unreadOnly) {
		query.andWhere(`notification.isRead = false`);
	}

	const notifications = await query.take(ps.limit!).getMany();

	// Mark all as read
	if (notifications.length > 0 && ps.markAsRead) {
		readNotification(user.id, notifications.map(x => x.id));
	}

	const notes = notifications.filter(notification => ['mention', 'reply', 'quote'].includes(notification.type)).map(notification => notification.note!);

	if (notes.length > 0) {
		read(user.id, notes);
	}

	return await Notifications.packMany(notifications, user.id);
});
