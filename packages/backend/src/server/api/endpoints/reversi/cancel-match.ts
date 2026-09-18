/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ReversiService } from '@/core/ReversiService.js';

export const meta = {
	requireCredential: true,

	kind: 'write:account',

	errors: {
	},
} as const;

export const paramDef = v.object({
	userId: v.optional(v.nullable(mi.misskeyId())),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
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
