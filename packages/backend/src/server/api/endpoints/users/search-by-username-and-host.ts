/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserSearchService } from '@/core/UserSearchService.js';
import { packedUserSchema } from '@/models/schema/user.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Search for a user by username and/or host.',

	res: v.array(packedUserSchema),
} as const;

// legacy の `allOf: [{ anyOf: [...] }, { limit, detail }]` の共通パート
const optionEntries = {
	limit: mi.limit({ max: 100, def: 10 }),
	detail: v.optional(v.boolean(), true),
};

// NOTE: cookbook R9 に従い allOf に混在した anyOf を各分岐へ共通パートを分配した v.union に変換している
export const paramDef = v.union([
	v.object({
		username: v.nullable(v.string()),
		...optionEntries,
	}),
	v.object({
		host: v.nullable(v.string()),
		...optionEntries,
	}),
]);

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
