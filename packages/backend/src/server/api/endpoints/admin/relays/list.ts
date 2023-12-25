/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { RelayService } from '@/core/RelayService.js';

export const meta = {
	tags: ['admin'],

	kind: 'read:admin',

	requireCredential: true,
	requireModerator: true,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				inbox: {
					type: 'string',
					optional: false, nullable: false,
					format: 'url',
				},
				status: {
					type: 'string',
					optional: false, nullable: false,
					default: 'requesting',
					enum: [
						'requesting',
						'accepted',
						'rejected',
					],
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private relayService: RelayService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.relayService.listRelay();
		});
	}
}
