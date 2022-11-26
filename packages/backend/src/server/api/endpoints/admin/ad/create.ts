import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AdsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		url: { type: 'string', minLength: 1 },
		memo: { type: 'string' },
		place: { type: 'string' },
		priority: { type: 'string' },
		ratio: { type: 'integer' },
		expiresAt: { type: 'integer' },
		imageUrl: { type: 'string', minLength: 1 },
	},
	required: ['url', 'memo', 'place', 'priority', 'ratio', 'expiresAt', 'imageUrl'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.adsRepository)
		private adsRepository: AdsRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.adsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				expiresAt: new Date(ps.expiresAt),
				url: ps.url,
				imageUrl: ps.imageUrl,
				priority: ps.priority,
				ratio: ps.ratio,
				place: ps.place,
				memo: ps.memo,
			});
		});
	}
}
