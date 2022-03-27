import { readNotification } from '../../common/read-notification.js';
import define from '../../define.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';
import { generateMutedInstanceNotificationQuery } from '../../common/generate-muted-instance-query.js';
import { Notifications, Followings, Mutings, Users } from '@/models/index.js';
import { notificationTypes } from '@/types.js';
import read from '@/services/note/read.js';
import { Brackets } from 'typeorm';

export const meta = {
	tags: ['account', 'notifications'],

	requireCredential: true,

	kind: 'read:notifications',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Notification',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		following: { type: 'boolean', default: false },
		unreadOnly: { type: 'boolean', default: false },
		markAsRead: { type: 'boolean', default: true },
		includeTypes: { type: 'array', items: {
			type: 'string', enum: notificationTypes,
		} },
		excludeTypes: { type: 'array', items: {
			type: 'string', enum: notificationTypes,
		} },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
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
		.leftJoinAndSelect('notifier.avatar', 'notifierAvatar')
		.leftJoinAndSelect('notifier.banner', 'notifierBanner')
		.leftJoinAndSelect('note.user', 'user')
		.leftJoinAndSelect('user.avatar', 'avatar')
		.leftJoinAndSelect('user.banner', 'banner')
		.leftJoinAndSelect('note.reply', 'reply')
		.leftJoinAndSelect('note.renote', 'renote')
		.leftJoinAndSelect('reply.user', 'replyUser')
		.leftJoinAndSelect('replyUser.avatar', 'replyUserAvatar')
		.leftJoinAndSelect('replyUser.banner', 'replyUserBanner')
		.leftJoinAndSelect('renote.user', 'renoteUser')
		.leftJoinAndSelect('renoteUser.avatar', 'renoteUserAvatar')
		.leftJoinAndSelect('renoteUser.banner', 'renoteUserBanner');

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

	const notifications = await query.take(ps.limit).getMany();

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
