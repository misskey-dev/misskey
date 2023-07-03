import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { FlashEntityService } from '@/core/entities/FlashEntityService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'flash/create'> {
	name = 'flash/create' as const;
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		private flashEntityService: FlashEntityService,
		private idService: IdService,
	) {
		super(async (ps, me) => {
			const flash = await this.flashsRepository.insert({
				id: this.idService.genId(),
				userId: me.id,
				createdAt: new Date(),
				updatedAt: new Date(),
				title: ps.title,
				summary: ps.summary,
				script: ps.script,
				permissions: ps.permissions,
			}).then(x => this.flashsRepository.findOneByOrFail(x.identifiers[0]));

			return await this.flashEntityService.pack(flash);
		});
	}
}
