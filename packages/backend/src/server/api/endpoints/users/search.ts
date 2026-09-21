/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { UserSearchService } from '@/core/UserSearchService.js';
import { packedUserSchema } from '@/models/schema/user.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,
	requiredRolePolicy: 'canSearchUsers',

	description: 'Search for users.',

	res: v.array(packedUserSchema),
} as const;

export const paramDef = v.object({
	query: v.string(),
	offset: v.optional(mi.integer(), 0),
	limit: mi.limit({ max: 100, def: 10 }),
	origin: v.optional(v.picklist(['local', 'remote', 'combined']), 'combined'),
	detail: v.optional(v.boolean(), true),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private userEntityService: UserEntityService,
		private userSearchService: UserSearchService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const users = await this.userSearchService.search(ps.query.trim(), me?.id ?? null, {
				offset: ps.offset,
				limit: ps.limit,
				origin: ps.origin,
			});

			return await this.userEntityService.packMany(users, me, { schema: ps.detail ? 'UserDetailed' : 'UserLite' });
		});
	}
}
