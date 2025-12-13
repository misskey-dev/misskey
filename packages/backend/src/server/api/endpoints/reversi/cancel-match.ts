/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { ReversiService } from '@/core/ReversiService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	requireCredential: true,

	kind: 'write:account',

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private reversiService: ReversiService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.userId) {
				await this.reversiService.matchSpecificUserCancel(me, ps.userId);
				return;
			} else {
				await this.reversiService.matchAnyUserCancel(me);
			}
		});
	}
}
