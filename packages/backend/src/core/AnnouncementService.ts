/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { User } from '@/models/entities/User.js';
import type { AnnouncementReadsRepository, AnnouncementsRepository, Announcement, AnnouncementRead } from '@/models/index.js';
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
	public async getReads(userId: User['id']): Promise<AnnouncementRead[]> {
		return this.announcementReadsRepository.findBy({
			userId: userId,
		});
	}

	@bindThis
	public async getUnreadAnnouncements(user: User): Promise<Announcement[]> {
		const readsQuery = this.announcementReadsRepository.createQueryBuilder('read')
			.select('read.announcementId')
			.where('read.userId = :userId', { userId: user.id });

		const q = this.announcementsRepository.createQueryBuilder('announcement')
			.where('announcement.isActive = true')
			.andWhere(new Brackets(qb => {
				qb.orWhere('announcement.userId = :userId', { userId: user.id });
				qb.orWhere('announcement.userId IS NULL');
			}))
			.andWhere('announcement.createdAt > :createdAt', { createdAt: user.createdAt })
			.andWhere(`announcement.id NOT IN (${ readsQuery.getQuery() })`);

		q.setParameters(readsQuery.getParameters());

		return q.getMany();
	}

	@bindThis
	public async read(user: User, announcementId: Announcement['id']): Promise<void> {
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
		announcements: Announcement[],
		me?: { id: User['id'] } | null | undefined,
		options?: {
			reads?: AnnouncementRead[];
		},
	): Promise<Packed<'Announcement'>[]> {
		const reads = me ? (options?.reads ?? await this.getReads(me.id)) : [];
		return announcements.map(announcement => ({
			id: announcement.id,
			createdAt: announcement.createdAt.toISOString(),
			updatedAt: announcement.updatedAt?.toISOString(),
			text: announcement.text,
			title: announcement.title,
			imageUrl: announcement.imageUrl,
			display: announcement.display,
			isRead: reads.some(read => read.announcementId === announcement.id),
		}));
	}
}
