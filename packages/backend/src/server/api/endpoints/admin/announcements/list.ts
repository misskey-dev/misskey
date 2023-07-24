import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import type { AnnouncementsRepository, AnnouncementReadsRepository, UsersRepository } from '@/models/index.js';
import type { Announcement } from '@/models/entities/Announcement.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
					example: 'xxxxxxxxxx',
				},
				createdAt: {
					type: 'string',
					optional: false, nullable: false,
					format: 'date-time',
				},
				updatedAt: {
					type: 'string',
					optional: false, nullable: true,
					format: 'date-time',
				},
				text: {
					type: 'string',
					optional: false, nullable: false,
				},
				title: {
					type: 'string',
					optional: false, nullable: false,
				},
				imageUrl: {
					type: 'string',
					optional: false, nullable: true,
				},
				userId: {
					type: 'string',
					optional: false, nullable: true,
				},
				user: {
					type: 'object',
					optional: true, nullable: false,
					ref: 'UserLite',
				},
				reads: {
					type: 'number',
					optional: false, nullable: false,
				},
				closeDuration: {
					type: 'number',
					optional: false, nullable: false,
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		@Inject(DI.announcementReadsRepository)
		private announcementReadsRepository: AnnouncementReadsRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private queryService: QueryService,
		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const builder = this.announcementsRepository.createQueryBuilder('announcement');
			if (ps.userId) {
				builder.where('"userId" = :userId', { userId: ps.userId });
			} else {
				builder.where('"userId" IS NULL');
			}

			const query = this.queryService.makePaginationQuery(builder, ps.sinceId, ps.untilId);

			const announcements = await query.limit(ps.limit).getMany();

			const reads = new Map<Announcement, number>();

			for (const announcement of announcements) {
				reads.set(announcement, await this.announcementReadsRepository.countBy({
					announcementId: announcement.id,
				}));
			}

			const users = await this.usersRepository.findBy({
				id: In(announcements.map(a => a.userId).filter(id => id != null)),
			});
			const packedUsers = await this.userEntityService.packMany(users, me, {
				detail: false,
			});

			return announcements.map(announcement => ({
				id: announcement.id,
				createdAt: announcement.createdAt.toISOString(),
				updatedAt: announcement.updatedAt?.toISOString() ?? null,
				title: announcement.title,
				text: announcement.text,
				imageUrl: announcement.imageUrl,
				userId: announcement.userId,
				user: packedUsers.find(user => user.id === announcement.userId),
				reads: reads.get(announcement)!,
				closeDuration: announcement.closeDuration,
			}));
		});
	}
}
