import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { PromoNotesRepository } from '@/models/index.js';
import { GetterService } from '@/server/api/GetterService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/promo/create'> {
	name = 'admin/promo/create' as const;
	constructor(
		@Inject(DI.promoNotesRepository)
		private promoNotesRepository: PromoNotesRepository,

		private getterService: GetterService,
	) {
		super(async (ps, me) => {
			const note = await this.getterService.getNote(ps.noteId).catch(e => {
				if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(this.meta.errors.noSuchNote);
				throw e;
			});

			const exist = await this.promoNotesRepository.findOneBy({ noteId: note.id });

			if (exist != null) {
				throw new ApiError(this.meta.errors.alreadyPromoted);
			}

			await this.promoNotesRepository.insert({
				noteId: note.id,
				expiresAt: new Date(ps.expiresAt),
				userId: note.userId,
			});
		});
	}
}
