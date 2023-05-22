import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AnnouncementsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/announcements/create'> {
	name = 'admin/announcements/create' as const;
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		private idService: IdService,
	) {
		super(async (ps, me) => {
			const announcement = await this.announcementsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				updatedAt: null,
				title: ps.title,
				text: ps.text,
				imageUrl: ps.imageUrl,
			}).then(x => this.announcementsRepository.findOneByOrFail(x.identifiers[0]));

			return Object.assign({}, announcement, { createdAt: announcement.createdAt.toISOString(), updatedAt: null });
		});
	}
}
