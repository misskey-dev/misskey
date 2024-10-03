/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserSearchService } from '@/core/UserSearchService.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Search for a user by username and/or host.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'User',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		detail: { type: 'boolean', default: true },

		username: { type: 'string', nullable: true },
		host: { type: 'string', nullable: true },
	},
	anyOf: [
		{ required: ['username'] },
		{ required: ['host'] },
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private userSearchService: UserSearchService,
	) {
		super(meta, paramDef, (ps, me) => {
			return this.userSearchService.search({
				username: ps.username,
				host: ps.host,
			}, {
				limit: ps.limit,
				detail: ps.detail,
			}, me);
		});
	}
}
