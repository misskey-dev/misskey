/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['non-productive'],

	description: 'Endpoint for testing input validation.',

	requireCredential: false,

	res: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'misskey:id',
				optional: true, nullable: false,
			},
			required: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			string: {
				type: 'string',
				optional: true, nullable: false,
			},
			default: {
				type: 'string',
				optional: true, nullable: false,
			},
			nullableDefault: {
				type: 'string',
				default: 'hello',
				optional: true, nullable: true,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		required: { type: 'boolean' },
		string: { type: 'string' },
		default: { type: 'string', default: 'hello' },
		nullableDefault: { type: 'string', nullable: true, default: 'hello' },
		id: { type: 'string', format: 'misskey:id' },
	},
	required: ['required'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
	) {
		super(meta, paramDef, async (ps, me) => {
			return ps;
		});
	}
}
