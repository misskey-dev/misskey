/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets, In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '@/models/User.js';
import type { AnnouncementReadsRepository, AnnouncementsRepository, MiAnnouncement, UsersRepository } from '@/models/_.js';
import { MiAnnouncementRead } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { Packed } from '@/misc/json-schema.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { AnnouncementEntityService } from '@/core/entities/AnnouncementEntityService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

@Injectable()
export class AnnouncementService {
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		@Inject(DI.announcementReadsRepository)
		private announcementReadsRepository: AnnouncementReadsRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private idService: IdService,
		private userEntityService: UserEntityService,
		private announcementEntityService: AnnouncementEntityService,
		private globalEventService: GlobalEventService,
		private moderationLogService: ModerationLogService,
	) {
	}

	@bindThis
	public async getReads(userId: MiUser['id']): Promise<MiAnnouncementRead[]> {
		return this.announcementReadsRepository.findBy({
			userId: userId,
		});
	}

	@bindThis
	public async getAnnouncements(
		me: MiUser | null,
		limit: number,
		offset: number,
		isActive?: boolean,
	): Promise<Packed<'Announcement'>[]> {
		const query = this.announcementsRepository.createQueryBuilder('announcement');
		if (me) {
			query.leftJoin(
				MiAnnouncementRead,
				'read',
				'read."announcementId" = announcement.id AND read."userId" = :userId',
				{ userId: me.id },
			);
			query.select([
				'announcement.*',
				'CASE WHEN read.id IS NULL THEN FALSE ELSE TRUE END as "isRead"',
			]);
			query
				.andWhere(
					new Brackets((qb) => {
						qb.orWhere('announcement."userId" = :userId', { userId: me.id });
						qb.orWhere('announcement."userId" IS NULL');
					}),
				)
				.andWhere(
					new Brackets((qb) => {
						qb.orWhere('announcement."forExistingUsers" = false');
						qb.orWhere('announcement."createdAt" > :createdAt', {
							createdAt: me.createdAt,
						});
					}),
				);
		} else {
			query.select([
				'announcement.*',
				'NULL as "isRead"',
			]);
			query.andWhere('announcement."userId" IS NULL');
			query.andWhere('announcement."forExistingUsers" = false');
		}

		if (isActive !== undefined) {
			query.andWhere('announcement."isActive" = :isActive', {
				isActive: isActive,
			});
		}

		query.orderBy({
			'"isRead"': 'ASC',
			'announcement."displayOrder"': 'DESC',
			'announcement."createdAt"': 'DESC',
		});

		return this.announcementEntityService.packMany(
			await query
				.limit(limit)
				.offset(offset)
				.getRawMany<MiAnnouncement & { isRead?: boolean | null }>(),
			me,
		);
	}

	@bindThis
	public async getUnreadAnnouncements(user: MiUser): Promise<MiAnnouncement[]> {
		const readsQuery = this.announcementReadsRepository.createQueryBuilder('read')
			.select('read.announcementId')
			.where('read.userId = :userId', { userId: user.id });

		const q = this.announcementsRepository.createQueryBuilder('announcement')
			.where('announcement.isActive = true')
			.andWhere(new Brackets(qb => {
				qb.orWhere('announcement.userId = :userId', { userId: user.id });
				qb.orWhere('announcement.userId IS NULL');
			}))
			.andWhere(new Brackets(qb => {
				qb.orWhere('announcement.forExistingUsers = false');
				qb.orWhere('announcement.createdAt > :createdAt', { createdAt: user.createdAt });
			}))
			.andWhere(`announcement.id NOT IN (${ readsQuery.getQuery() })`);

		q.setParameters(readsQuery.getParameters());
		q.orderBy({
			'announcement."isActive"': 'DESC',
			'announcement."displayOrder"': 'DESC',
			'announcement."createdAt"': 'DESC',
		});

		return q.getMany();
	}

	@bindThis
	public async create(values: Partial<MiAnnouncement>, moderator?: MiUser): Promise<{ raw: MiAnnouncement; packed: Packed<'Announcement'> }> {
		const announcement = await this.announcementsRepository.insert({
			id: this.idService.genId(),
			createdAt: new Date(),
			updatedAt: null,
			title: values.title,
			text: values.text,
			imageUrl: values.imageUrl,
			icon: values.icon,
			display: values.display,
			forExistingUsers: values.forExistingUsers,
			needConfirmationToRead: values.needConfirmationToRead,
			closeDuration: values.closeDuration,
			displayOrder: values.displayOrder,
			userId: values.userId,
		}).then(x => this.announcementsRepository.findOneByOrFail(x.identifiers[0]));

		const packed = (await this.packMany([announcement]))[0];

		if (values.userId) {
			this.globalEventService.publishMainStream(values.userId, 'announcementCreated', {
				announcement: packed,
			});

			if (moderator) {
				this.moderationLogService.log(moderator, 'createUserAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
					userId: values.userId,
				});
			}
		} else {
			this.globalEventService.publishBroadcastStream('announcementCreated', {
				announcement: packed,
			});

			if (moderator) {
				this.moderationLogService.log(moderator, 'createGlobalAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
				});
			}
		}

		return {
			raw: announcement,
			packed: packed,
		};
	}

	@bindThis
	public async list(
		userId: MiUser['id'] | null,
		limit: number,
		offset: number,
		moderator: MiUser,
	): Promise<(MiAnnouncement & { userInfo: Packed<'UserLite'> | null, readCount: number })[]> {
		const query = this.announcementsRepository.createQueryBuilder('announcement');
		if (userId) {
			query.andWhere('announcement."userId" = :userId', { userId: userId });
		} else {
			query.andWhere('announcement."userId" IS NULL');
		}

		query.orderBy({
			'announcement."isActive"': 'DESC',
			'announcement."displayOrder"': 'DESC',
			'announcement."createdAt"': 'DESC',
		});

		const announcements = await query
			.limit(limit)
			.offset(offset)
			.getMany();

		const reads = new Map<MiAnnouncement, number>();

		for (const announcement of announcements) {
			reads.set(announcement, await this.announcementReadsRepository.countBy({
				announcementId: announcement.id,
			}));
		}

		const users = await this.usersRepository.findBy({
			id: In(announcements.map(a => a.userId).filter(id => id != null)),
		});
		const packedUsers = await this.userEntityService.packMany(users, moderator, {
			detail: false,
		});

		return announcements.map(announcement => ({
			...announcement,
			userInfo: packedUsers.find(u => u.id === announcement.userId) ?? null,
			readCount: reads.get(announcement) ?? 0,
		}));
	}

	@bindThis
	public async update(announcement: MiAnnouncement, values: Partial<MiAnnouncement>, moderator?: MiUser): Promise<void> {
		await this.announcementsRepository.update(announcement.id, {
			updatedAt: new Date(),
			title: values.title,
			text: values.text,
			/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- 空の文字列の場合、nullを渡すようにするため */
			imageUrl: values.imageUrl || null,
			display: values.display,
			icon: values.icon,
			forExistingUsers: values.forExistingUsers,
			needConfirmationToRead: values.needConfirmationToRead,
			closeDuration: values.closeDuration,
			displayOrder: values.displayOrder,
			isActive: values.isActive,
		});

		const after = await this.announcementsRepository.findOneByOrFail({ id: announcement.id });

		if (moderator) {
			if (announcement.userId) {
				this.moderationLogService.log(moderator, 'updateUserAnnouncement', {
					announcementId: announcement.id,
					before: announcement,
					after: after,
				});
			} else {
				this.moderationLogService.log(moderator, 'updateGlobalAnnouncement', {
					announcementId: announcement.id,
					before: announcement,
					after: after,
				});
			}
		}
	}

	@bindThis
	public async delete(announcement: MiAnnouncement, moderator?: MiUser): Promise<void> {
		await this.announcementsRepository.delete(announcement.id);

		if (moderator) {
			if (announcement.userId) {
				this.moderationLogService.log(moderator, 'deleteUserAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
				});
			} else {
				this.moderationLogService.log(moderator, 'deleteGlobalAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
				});
			}
		}
	}

	@bindThis
	public async read(user: MiUser, announcementId: MiAnnouncement['id']): Promise<void> {
		try {
			await this.announcementReadsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				announcementId: announcementId,
				userId: user.id,
			});
		} catch (e) {
			return;
		}

		if ((await this.getUnreadAnnouncements(user)).length === 0) {
			this.globalEventService.publishMainStream(user.id, 'readAllAnnouncements');
		}
	}

	@bindThis
	public async packMany(
		announcements: MiAnnouncement[],
		me?: { id: MiUser['id'] } | null | undefined,
		options?: {
			reads?: MiAnnouncementRead[];
		},
	): Promise<Packed<'Announcement'>[]> {
		const reads = me ? (options?.reads ?? await this.getReads(me.id)) : [];
		return announcements.map(announcement => ({
			id: announcement.id,
			createdAt: announcement.createdAt.toISOString(),
			updatedAt: announcement.updatedAt?.toISOString() ?? null,
			text: announcement.text,
			title: announcement.title,
			imageUrl: announcement.imageUrl,
			icon: announcement.icon,
			display: announcement.display,
			needConfirmationToRead: announcement.needConfirmationToRead,
			forYou: announcement.userId === me?.id,
			isRead: reads.some(read => read.announcementId === announcement.id),
		}));
	}
}
