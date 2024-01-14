/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { RelayService } from '@/core/RelayService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:relays',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		inbox: { type: 'string' },
	},
	required: ['inbox'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private relayService: RelayService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.relayService.removeRelay(ps.inbox);
		});
	}
}
