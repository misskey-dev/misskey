/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { AnnouncementsRepository, AnnouncementReadsRepository, MiAnnouncement, MiUser } from '@/models/_.js';
import type { Packed } from '@/misc/json-schema.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';

@Injectable()
export class AnnouncementEntityService {
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		@Inject(DI.announcementReadsRepository)
		private announcementReadsRepository: AnnouncementReadsRepository,

		private idService: IdService,
	) {
	}

	@bindThis
	public async pack(
		src: MiAnnouncement['id'] | MiAnnouncement & { isRead?: boolean | null },
		me?: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'Announcement'>> {
		const announcement = typeof src === 'object'
			? src
			: await this.announcementsRepository.findOneByOrFail({
				id: src,
			}) as MiAnnouncement & { isRead?: boolean | null };

		if (me && announcement.isRead === undefined) {
			announcement.isRead = await this.announcementReadsRepository
				.countBy({
					announcementId: announcement.id,
					userId: me.id,
				})
				.then((count: number) => count > 0);
		}

		return {
			id: announcement.id,
			createdAt: this.idService.parse(announcement.id).date.toISOString(),
			updatedAt: announcement.updatedAt?.toISOString() ?? null,
			title: announcement.title,
			text: announcement.text,
			imageUrl: announcement.imageUrl,
			icon: announcement.icon,
			display: announcement.display,
			forYou: announcement.userId === me?.id,
			needConfirmationToRead: announcement.needConfirmationToRead,
			silence: announcement.silence,
			isRead: announcement.isRead !== null ? announcement.isRead : undefined,
		};
	}

	@bindThis
	public async packMany(
		announcements: (MiAnnouncement['id'] | MiAnnouncement & { isRead?: boolean | null } | MiAnnouncement)[],
		me?: { id: MiUser['id'] } | null | undefined,
	) : Promise<Packed<'Announcement'>[]> {
		return (await Promise.allSettled(announcements.map(x => this.pack(x, me))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'Announcement'>>).value);
	}
}
