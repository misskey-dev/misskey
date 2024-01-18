/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ReversiMatchingEntityService } from '@/core/entities/ReversiMatchingEntityService.js';
import type { ReversiMatchingsRepository } from '@/models/_.js';

export const meta = {
	requireCredential: true,

	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: { ref: 'ReversiMatching' },
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.reversiMatchingsRepository)
		private reversiMatchingsRepository: ReversiMatchingsRepository,

		private reversiMatchingEntityService: ReversiMatchingEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const invitations = await this.reversiMatchingsRepository.findBy({
				childId: me.id,
			});

			return await this.reversiMatchingEntityService.packMany(invitations, me);
		});
	}
}
