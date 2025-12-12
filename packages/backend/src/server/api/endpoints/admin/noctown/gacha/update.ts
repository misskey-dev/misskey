/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoctownGachasRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin', 'noctown'],
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:noctown',
	errors: {
		noSuchGacha: {
			message: 'No such gacha.',
			code: 'NO_SUCH_GACHA',
			id: 'f2b03a03-0001-0001-0001-000000000001',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		gachaId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string', minLength: 1, maxLength: 128 },
		description: { type: 'string', maxLength: 1024, nullable: true },
		costPerPull: { type: 'integer', minimum: 0 },
		isActive: { type: 'boolean' },
		startDate: { type: 'integer', nullable: true },
		endDate: { type: 'integer', nullable: true },
		maxPullsPerPlayer: { type: 'integer', minimum: 1, nullable: true },
		gachaType: { type: 'string', enum: ['standard', 'premium', 'limited', 'event'] },
	},
	required: ['gachaId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownGachasRepository)
		private noctownGachasRepository: NoctownGachasRepository,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const gacha = await this.noctownGachasRepository.findOneBy({ id: ps.gachaId });
			if (!gacha) {
				throw new ApiError(meta.errors.noSuchGacha);
			}

			const updateData: Record<string, unknown> = {};

			if (ps.name !== undefined) updateData.name = ps.name;
			if (ps.description !== undefined) updateData.description = ps.description;
			if (ps.costPerPull !== undefined) updateData.costPerPull = ps.costPerPull;
			if (ps.isActive !== undefined) updateData.isActive = ps.isActive;
			if (ps.startDate !== undefined) updateData.startDate = ps.startDate ? new Date(ps.startDate) : null;
			if (ps.endDate !== undefined) updateData.endDate = ps.endDate ? new Date(ps.endDate) : null;
			if (ps.maxPullsPerPlayer !== undefined) updateData.maxPullsPerPlayer = ps.maxPullsPerPlayer;
			if (ps.gachaType !== undefined) updateData.gachaType = ps.gachaType;

			await this.noctownGachasRepository.update({ id: ps.gachaId }, updateData);

			this.moderationLogService.log(me, 'updateNoctownGacha', {
				gachaId: ps.gachaId,
				before: gacha,
				after: updateData,
			});
		});
	}
}
