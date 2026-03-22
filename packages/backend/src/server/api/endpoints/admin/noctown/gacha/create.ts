/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoctownGachasRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

export const meta = {
	tags: ['admin', 'noctown'],
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:noctown',
	res: {
		type: 'object',
		properties: {
			id: { type: 'string' },
			name: { type: 'string' },
			description: { type: 'string', nullable: true },
			costPerPull: { type: 'number' },
			isActive: { type: 'boolean' },
			gachaType: { type: 'string' },
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 128 },
		description: { type: 'string', maxLength: 1024, nullable: true },
		costPerPull: { type: 'integer', minimum: 0, default: 100 },
		isActive: { type: 'boolean', default: true },
		startDate: { type: 'integer', nullable: true },
		endDate: { type: 'integer', nullable: true },
		maxPullsPerPlayer: { type: 'integer', minimum: 1, nullable: true },
		gachaType: { type: 'string', enum: ['standard', 'premium', 'limited', 'event'], default: 'standard' },
	},
	required: ['name'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownGachasRepository)
		private noctownGachasRepository: NoctownGachasRepository,

		private idService: IdService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const gacha = await this.noctownGachasRepository.insertOne({
				id: this.idService.gen(),
				name: ps.name,
				description: ps.description ?? null,
				costPerPull: ps.costPerPull ?? 100,
				isActive: ps.isActive ?? true,
				startDate: ps.startDate ? new Date(ps.startDate) : null,
				endDate: ps.endDate ? new Date(ps.endDate) : null,
				maxPullsPerPlayer: ps.maxPullsPerPlayer ?? null,
				gachaType: ps.gachaType ?? 'standard',
			});

			this.moderationLogService.log(me, 'createNoctownGacha', {
				gachaId: gacha.id,
				gachaName: gacha.name,
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
			};
		});
	}
}
