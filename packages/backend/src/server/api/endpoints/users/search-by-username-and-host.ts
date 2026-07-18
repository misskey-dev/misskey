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
	allOf: [
		{
			anyOf: [
				{
					type: 'object',
					properties: {
						username: { type: 'string', nullable: true },
					},
					required: ['username'],
				},
				{
					type: 'object',
					properties: {
						host: { type: 'string', nullable: true },
					},
					required: ['host'],
				},
			],
		},
		{
			type: 'object',
			properties: {
				limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
				detail: { type: 'boolean', default: true },
			},
		},
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private userSearchService: UserSearchService,
	) {
		super(meta, paramDef, (ps, me) => {
			return this.userSearchService.searchByUsernameAndHost({
				username: 'username' in ps ? ps.username : undefined,
				host: 'host' in ps ? ps.host : undefined,
			}, {
				limit: ps.limit,
				detail: ps.detail,
			}, me);
		});
	}
}
