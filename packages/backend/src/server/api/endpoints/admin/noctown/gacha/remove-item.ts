/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { NoctownGachaItemsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['admin', 'noctown'],
	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:noctown',
	errors: {
		noSuchGachaItem: {
			message: 'No such gacha item.',
			code: 'NO_SUCH_GACHA_ITEM',
			id: 'f2b03a03-0001-0004-0001-000000000001',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		gachaItemId: { type: 'string', format: 'misskey:id' },
	},
	required: ['gachaItemId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownGachaItemsRepository)
		private noctownGachaItemsRepository: NoctownGachaItemsRepository,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const gachaItem = await this.noctownGachaItemsRepository.findOneBy({ id: ps.gachaItemId });
			if (!gachaItem) {
				throw new ApiError(meta.errors.noSuchGachaItem);
			}

			await this.noctownGachaItemsRepository.delete({ id: ps.gachaItemId });

			this.moderationLogService.log(me, 'removeNoctownGachaItem', {
				gachaItemId: ps.gachaItemId,
				gachaId: gachaItem.gachaId,
				itemId: gachaItem.itemId,
			});
		});
	}
}
