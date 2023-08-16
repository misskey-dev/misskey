/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '@/models/entities/User.js';
import type { AnnouncementReadsRepository, AnnouncementsRepository, MiAnnouncement, MiAnnouncementRead } from '@/models/index.js';
import { bindThis } from '@/decorators.js';
import { Packed } from '@/misc/json-schema.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';

@Injectable()
export class AnnouncementService {
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		@Inject(DI.announcementReadsRepository)
		private announcementReadsRepository: AnnouncementReadsRepository,

		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
	}

	@bindThis
	public async getReads(userId: MiUser['id']): Promise<MiAnnouncementRead[]> {
		return this.announcementReadsRepository.findBy({
			userId: userId,
		});
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

		return q.getMany();
	}

	@bindThis
	public async create(values: Partial<MiAnnouncement>): Promise<{ raw: MiAnnouncement; packed: Packed<'Announcement'> }> {
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
			userId: values.userId,
		}).then(x => this.announcementsRepository.findOneByOrFail(x.identifiers[0]));

		const packed = (await this.packMany([announcement]))[0];

		if (values.userId) {
			this.globalEventService.publishMainStream(values.userId, 'announcementCreated', {
				announcement: packed,
			});
		} else {
			this.globalEventService.publishBroadcastStream('announcementCreated', {
				announcement: packed,
			});
		}

		return {
			raw: announcement,
			packed: packed,
		};
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
