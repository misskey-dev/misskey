/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type {
	AnnouncementReadsRepository,
	AnnouncementsRepository,
} from '@/models/index.js';
import type { Packed } from '@/misc/json-schema.js';
import { bindThis } from '@/decorators.js';
import { MiAnnouncement, MiUser } from '@/models/index.js';

@Injectable()
export class AnnouncementEntityService {
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		@Inject(DI.announcementReadsRepository)
		private announcementReadsRepository: AnnouncementReadsRepository,
	) {
	}

	@bindThis
	public async pack(
		src: MiAnnouncement['id'] | MiAnnouncement & { isRead?: boolean | null },
		me: { id: MiUser['id'] } | null | undefined,
	): Promise<Packed<'Announcement'>> {
		const announcement = typeof src === 'object'
			? src
			: await this.announcementsRepository.findOneByOrFail({
				id: src,
			}) as MiAnnouncement & { isRead?: boolean | null };

		if (me && announcement.isRead === undefined) {
			announcement.isRead = await this.announcementReadsRepository.countBy({
				announcementId: announcement.id,
				userId: me.id,
			}).then(count => count > 0);
		}

		return {
			id: announcement.id,
			createdAt: announcement.createdAt.toISOString(),
			updatedAt: announcement.updatedAt?.toISOString() ?? null,
			title: announcement.title,
			text: announcement.text,
			imageUrl: announcement.imageUrl,
			icon: announcement.icon,
			display: announcement.display,
			forYou: announcement.userId === me?.id,
			needConfirmationToRead: announcement.needConfirmationToRead,
			closeDuration: announcement.closeDuration,
			displayOrder: announcement.displayOrder,
			isRead: announcement.isRead !== null ? announcement.isRead : undefined,
		};
	}

	@bindThis
	public async packMany(
		announcements: (MiAnnouncement['id'] | MiAnnouncement & { isRead?: boolean | null } | MiAnnouncement)[],
		me: { id: MiUser['id'] } | null | undefined,
	) : Promise<Packed<'Announcement'>[]> {
		return (await Promise.allSettled(announcements.map(x => this.pack(x, me))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'Announcement'>>).value);
	}
}
