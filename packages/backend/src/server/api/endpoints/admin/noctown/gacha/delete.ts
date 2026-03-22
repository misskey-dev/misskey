/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoctownGachasRepository, NoctownGachaItemsRepository, NoctownGachaPullsRepository } from '@/models/_.js';
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
			id: 'f2b03a03-0001-0002-0001-000000000001',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		gachaId: { type: 'string', format: 'misskey:id' },
	},
	required: ['gachaId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownGachasRepository)
		private noctownGachasRepository: NoctownGachasRepository,
		@Inject(DI.noctownGachaItemsRepository)
		private noctownGachaItemsRepository: NoctownGachaItemsRepository,
		@Inject(DI.noctownGachaPullsRepository)
		private noctownGachaPullsRepository: NoctownGachaPullsRepository,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const gacha = await this.noctownGachasRepository.findOneBy({ id: ps.gachaId });
			if (!gacha) {
				throw new ApiError(meta.errors.noSuchGacha);
			}

			// Delete related gacha items first
			await this.noctownGachaItemsRepository.delete({ gachaId: ps.gachaId });

			// Delete pull history
			await this.noctownGachaPullsRepository.delete({ gachaId: ps.gachaId });

			// Delete gacha
			await this.noctownGachasRepository.delete({ id: ps.gachaId });

			this.moderationLogService.log(me, 'deleteNoctownGacha', {
				gachaId: ps.gachaId,
				gachaName: gacha.name,
			});
		});
	}
}
