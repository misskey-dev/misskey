/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets, EntityNotFoundError, In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '@/models/User.js';
import type { AnnouncementReadsRepository, AnnouncementsRepository, MiAnnouncement, UsersRepository } from '@/models/_.js';
import { MiAnnouncementRead } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { Packed } from '@/misc/json-schema.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { AnnouncementEntityService } from '@/core/entities/AnnouncementEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

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
	public async getUnreadAnnouncements(user: MiUser): Promise<Packed<'Announcement'>[]> {
		const q = this.announcementsRepository.createQueryBuilder('announcement');
		q.leftJoinAndSelect(
			MiAnnouncementRead,
			'read',
			'read."announcementId" = announcement.id AND read."userId" = :userId',
			{ userId: user.id },
		);

		q
			.where('read.id IS NULL')
			.andWhere('announcement.isActive = true')
			.andWhere('announcement.silence = false')
			.andWhere(new Brackets(qb => {
				qb.orWhere('announcement.userId = :userId', { userId: user.id });
				qb.orWhere('announcement.userId IS NULL');
			}))
			.andWhere(new Brackets(qb => {
				qb.orWhere('announcement.forExistingUsers = false');
				qb.orWhere('announcement.id > :userId', { userId: user.id });
			}));

		q.orderBy({
			'announcement."displayOrder"': 'DESC',
			'announcement.id': 'DESC',
		});

		return this.announcementEntityService.packMany(
			await q.getMany(),
			user,
		);
	}

	@bindThis
	public async create(values: Partial<MiAnnouncement>, moderator?: MiUser): Promise<{ raw: MiAnnouncement; packed: Packed<'Announcement'> }> {
		const announcement = await this.announcementsRepository.insert({
			id: this.idService.gen(),
			updatedAt: null,
			title: values.title,
			text: values.text,
			imageUrl: values.imageUrl,
			icon: values.icon,
			display: values.display,
			forExistingUsers: values.forExistingUsers,
			silence: values.silence,
			needConfirmationToRead: values.needConfirmationToRead,
			closeDuration: values.closeDuration,
			displayOrder: values.displayOrder,
			userId: values.userId,
		}).then(x => this.announcementsRepository.findOneByOrFail(x.identifiers[0]));

		const packed = (await this.announcementEntityService.packMany([announcement], null))[0];

		if (values.userId) {
			this.globalEventService.publishMainStream(values.userId, 'announcementCreated', {
				announcement: packed,
			});

			if (moderator) {
				const user = await this.usersRepository.findOneByOrFail({ id: values.userId });
				this.moderationLogService.log(moderator, 'createUserAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
					userId: values.userId,
					userUsername: user.username,
					userHost: user.host,
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
	): Promise<(MiAnnouncement & { userInfo: Packed<'UserLite'> | null, reads: number, lastReadAt: Date | null })[]> {
		const query = this.announcementsRepository.createQueryBuilder('announcement');

		if (userId) {
			query.andWhere('announcement."userId" = :userId', { userId: userId });
		} else {
			query.andWhere('announcement."userId" IS NULL');
		}

		query.orderBy({
			'announcement."isActive"': 'DESC',
			'announcement.id': 'DESC',
		});

		const announcements = await query
			.limit(limit)
			.offset(offset)
			.getMany();

		const reads = announcements.length > 0
			? await this.announcementReadsRepository.createQueryBuilder()
				.select('"announcementId", count(*) as "reads", max("id") as "lastReadId"')
				.where('"announcementId" IN (:...announcementIds)', { announcementIds: announcements.map(a => a.id) })
				.groupBy('"announcementId"')
				.getRawMany<{ announcementId: string, reads: number, lastReadId: string | null }>()
				.then(rs => new Map(rs.map(r => [r.announcementId, { reads: r.reads, lastReadAt: r.lastReadId ? this.idService.parse(r.lastReadId).date : null }])))
			: new Map();

		const users = await this.usersRepository.findBy({
			id: In(announcements.map(a => a.userId).filter(id => id != null)),
		});
		const packedUsers = await this.userEntityService.packMany(users, moderator, {
			schema: 'UserLite'
		});

		return announcements.map(announcement => ({
			...announcement,
			...reads.get(announcement.id) ?? { reads: 0, lastReadAt: null },
			userInfo: packedUsers.find(u => u.id === announcement.userId) ?? null,
		}));
	}

	@bindThis
	public async update(announcement: MiAnnouncement, values: Partial<MiAnnouncement>, moderator?: MiUser): Promise<void> {
		if (announcement.userId && announcement.userId !== values.userId) {
			await this.announcementReadsRepository.delete({
				announcementId: announcement.id,
				userId: announcement.userId,
			});
		}

		await this.announcementsRepository.update(announcement.id, {
			updatedAt: new Date(),
			isActive: values.isActive,
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
			silence: values.silence,
			userId: values.userId,
		});

		const after = await this.announcementsRepository.findOneByOrFail({ id: announcement.id });

		if (moderator) {
			if (announcement.userId) {
				const user = await this.usersRepository.findOneByOrFail({ id: announcement.userId });
				this.moderationLogService.log(moderator, 'updateUserAnnouncement', {
					announcementId: announcement.id,
					before: announcement,
					after: after,
					userId: announcement.userId,
					userUsername: user.username,
					userHost: user.host,
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
		await this.announcementReadsRepository.delete({
			announcementId: announcement.id,
		});
		await this.announcementsRepository.delete(announcement.id);

		if (moderator) {
			if (announcement.userId) {
				const user = await this.usersRepository.findOneByOrFail({ id: announcement.userId });
				this.moderationLogService.log(moderator, 'deleteUserAnnouncement', {
					announcementId: announcement.id,
					announcement: announcement,
					userId: announcement.userId,
					userUsername: user.username,
					userHost: user.host,
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
	public async getAnnouncement(announcementId: MiAnnouncement['id'], me: MiUser | null): Promise<Packed<'Announcement'>> {
		const announcement = await this.announcementsRepository.findOneByOrFail({ id: announcementId });
		if (me) {
			if (announcement.userId && announcement.userId !== me.id) {
				throw new EntityNotFoundError(this.announcementsRepository.metadata.target, { id: announcementId });
			}

			const read = await this.announcementReadsRepository.findOneBy({
				announcementId: announcement.id,
				userId: me.id,
			});
			return this.announcementEntityService.pack({ ...announcement, isRead: read !== null }, me);
		} else {
			return this.announcementEntityService.pack(announcement, null);
		}
	}

	@bindThis
	public async getAnnouncements(
		me: MiUser | null,
		limit: number,
		offset: number,
		isActive: boolean,
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
				'read.id IS NOT NULL as "isRead"',
			]);
			query
				.andWhere(new Brackets((qb) => {
					qb.orWhere(new Brackets((nqb) => {
						nqb.andWhere('announcement."userId" = :userId', { userId: me.id });
						nqb.andWhere(isActive ? 'read.id IS NULL' : 'read.id IS NOT NULL');
					}));
					qb.orWhere(new Brackets((nqb) => {
						nqb.andWhere('announcement."userId" IS NULL');
						nqb.andWhere('announcement."isActive" = :isActive', { isActive });
					}));
				}))
				.andWhere(new Brackets((qb) => {
					qb.orWhere('announcement."forExistingUsers" = false');
					qb.orWhere('announcement.id > :userId', { userId: me.id });
				}));
		} else {
			query.select([
				'announcement.*',
				'NULL as "isRead"',
			]);
			query.andWhere('announcement."userId" IS NULL');
			query.andWhere('announcement."forExistingUsers" = false');
			query.andWhere('announcement."isActive" = :isActive', { isActive });
		}

		if (isActive) {
			query.orderBy({
				'"isRead"': 'ASC',
				'announcement."displayOrder"': 'DESC',
				'announcement.id': 'DESC',
			});
		} else {
			query.orderBy({
				'announcement.id': 'DESC',
			});
		}

		return this.announcementEntityService.packMany(
			await query
				.limit(limit)
				.offset(offset)
				.getRawMany<MiAnnouncement & { isRead?: boolean | null }>(),
			me,
		);
	}

	@bindThis
	public async countUnreadAnnouncements(user: MiUser): Promise<number> {
		const q = this.announcementsRepository.createQueryBuilder('announcement');
		q.leftJoinAndSelect(
			MiAnnouncementRead,
			'read',
			'read."announcementId" = announcement.id AND read."userId" = :userId',
			{ userId: user.id },
		);

		q
			.where('read.id IS NULL')
			.andWhere('announcement.isActive = true')
			.andWhere('announcement.silence = false')
			.andWhere(new Brackets(qb => {
				qb.orWhere('announcement.userId = :userId', { userId: user.id });
				qb.orWhere('announcement.userId IS NULL');
			}))
			.andWhere(new Brackets(qb => {
				qb.orWhere('announcement.forExistingUsers = false');
				qb.orWhere('announcement.id > :userId', { userId: user.id });
			}));

		return q.getCount();
	}

	@bindThis
	public async read(user: MiUser, announcementId: MiAnnouncement['id']): Promise<void> {
		try {
			await this.announcementReadsRepository.insert({
				id: this.idService.gen(),
				announcementId: announcementId,
				userId: user.id,
			});
		} catch (e) {
			return;
		}

		if ((await this.countUnreadAnnouncements(user)) === 0) {
			this.globalEventService.publishMainStream(user.id, 'readAllAnnouncements');
		}
	}
}
