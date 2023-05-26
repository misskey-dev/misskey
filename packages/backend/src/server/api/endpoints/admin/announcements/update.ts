import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AnnouncementsRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/announcements/update'> {
	name = 'admin/announcements/update' as const;
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,
	) {
		super(async (ps, me) => {
			const announcement = await this.announcementsRepository.findOneBy({ id: ps.id });

			if (announcement == null) throw new ApiError(this.meta.errors.noSuchAnnouncement);

			await this.announcementsRepository.update(announcement.id, {
				updatedAt: new Date(),
				title: ps.title,
				text: ps.text,
				/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- 空の文字列の場合、nullを渡すようにするため */
				imageUrl: ps.imageUrl || null, 
			});
		});
	}
}
