import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, FollowingsRepository, MutingsRepository, UserProfilesRepository, NotificationsRepository } from '@/models/index.js';
import { notificationTypes } from '@/types.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteReadService } from '@/core/NoteReadService.js';
import { NotificationEntityService } from '@/core/entities/NotificationEntityService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['account', 'notifications'],

	requireCredential: true,

	limit: {
		duration: 60000,
		max: 15,
	},

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
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.notificationsRepository)
		private notificationsRepository: NotificationsRepository,

		private notificationEntityService: NotificationEntityService,
		private notificationService: NotificationService,
		private queryService: QueryService,
		private noteReadService: NoteReadService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// includeTypes が空の場合はクエリしない
			if (ps.includeTypes && ps.includeTypes.length === 0) {
				return [];
			}
			// excludeTypes に全指定されている場合はクエリしない
			if (notificationTypes.every(type => ps.excludeTypes?.includes(type))) {
				return [];
			}
			const followingQuery = this.followingsRepository.createQueryBuilder('following')
				.select('following.followeeId')
				.where('following.followerId = :followerId', { followerId: me.id });

			const mutingQuery = this.mutingsRepository.createQueryBuilder('muting')
				.select('muting.muteeId')
				.where('muting.muterId = :muterId', { muterId: me.id });

			const mutingInstanceQuery = this.userProfilesRepository.createQueryBuilder('user_profile')
				.select('user_profile.mutedInstances')
				.where('user_profile.userId = :muterId', { muterId: me.id });

			const suspendedQuery = this.usersRepository.createQueryBuilder('users')
				.select('users.id')
				.where('users.isSuspended = TRUE');

			const query = this.queryService.makePaginationQuery(this.notificationsRepository.createQueryBuilder('notification'), ps.sinceId, ps.untilId)
				.andWhere('notification.notifieeId = :meId', { meId: me.id })
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

			// muted users
			query.andWhere(new Brackets(qb => { qb
				.where(`notification.notifierId NOT IN (${ mutingQuery.getQuery() })`)
				.orWhere('notification.notifierId IS NULL');
			}));
			query.setParameters(mutingQuery.getParameters());

			// muted instances
			query.andWhere(new Brackets(qb => { qb
				.andWhere('notifier.host IS NULL')
				.orWhere(`NOT (( ${mutingInstanceQuery.getQuery()} )::jsonb ? notifier.host)`);
			}));
			query.setParameters(mutingInstanceQuery.getParameters());

			// suspended users
			query.andWhere(new Brackets(qb => { qb
				.where(`notification.notifierId NOT IN (${ suspendedQuery.getQuery() })`)
				.orWhere('notification.notifierId IS NULL');
			}));

			if (ps.following) {
				query.andWhere(`((notification.notifierId IN (${ followingQuery.getQuery() })) OR (notification.notifierId = :meId))`, { meId: me.id });
				query.setParameters(followingQuery.getParameters());
			}

			if (ps.includeTypes && ps.includeTypes.length > 0) {
				query.andWhere('notification.type IN (:...includeTypes)', { includeTypes: ps.includeTypes });
			} else if (ps.excludeTypes && ps.excludeTypes.length > 0) {
				query.andWhere('notification.type NOT IN (:...excludeTypes)', { excludeTypes: ps.excludeTypes });
			}

			if (ps.unreadOnly) {
				query.andWhere('notification.isRead = false');
			}

			const notifications = await query.take(ps.limit).getMany();

			// Mark all as read
			if (notifications.length > 0 && ps.markAsRead) {
				this.notificationService.readNotification(me.id, notifications.map(x => x.id));
			}

			const notes = notifications.filter(notification => ['mention', 'reply', 'quote'].includes(notification.type)).map(notification => notification.note!);

			if (notes.length > 0) {
				this.noteReadService.read(me.id, notes);
			}

			return await this.notificationEntityService.packMany(notifications, me.id);
		});
	}
}
