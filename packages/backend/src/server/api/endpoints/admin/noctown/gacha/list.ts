/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoctownGachasRepository, NoctownGachaPullsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['admin', 'noctown'],
	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:noctown',
	res: {
		type: 'array',
		items: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				name: { type: 'string' },
				description: { type: 'string', nullable: true },
				costPerPull: { type: 'number' },
				isActive: { type: 'boolean' },
				gachaType: { type: 'string' },
				totalPulls: { type: 'number' },
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
		offset: { type: 'integer', minimum: 0, default: 0 },
		includeInactive: { type: 'boolean', default: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownGachasRepository)
		private noctownGachasRepository: NoctownGachasRepository,
		@Inject(DI.noctownGachaPullsRepository)
		private noctownGachaPullsRepository: NoctownGachaPullsRepository,
	) {
		super(meta, paramDef, async (ps) => {
			const query = this.noctownGachasRepository.createQueryBuilder('gacha');

			if (!ps.includeInactive) {
				query.where('gacha.isActive = :isActive', { isActive: true });
			}

			query
				.orderBy('gacha.createdAt', 'DESC')
				.take(ps.limit ?? 30)
				.skip(ps.offset ?? 0);

			const gachas = await query.getMany();

			// Get pull counts for each gacha
			const results = await Promise.all(gachas.map(async (gacha) => {
				const totalPulls = await this.noctownGachaPullsRepository.count({
					where: { gachaId: gacha.id },
				});

				return {
					id: gacha.id,
					name: gacha.name,
					description: gacha.description,
					costPerPull: gacha.costPerPull,
					isActive: gacha.isActive,
					startDate: gacha.startDate?.toISOString() ?? null,
					endDate: gacha.endDate?.toISOString() ?? null,
					maxPullsPerPlayer: gacha.maxPullsPerPlayer,
					gachaType: gacha.gachaType,
					createdAt: gacha.createdAt.toISOString(),
					totalPulls,
				};
			}));

			return results;
		});
	}
}
