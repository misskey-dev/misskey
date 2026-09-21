/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull, Not } from 'typeorm';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AccessTokensRepository } from '@/models/_.js';
import { AppEntityService } from '@/core/entities/AppEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	requireCredential: true,

	secure: true,

	res: v.array(v.object({
		id: v.pipe(v.string(), mi.format('misskey:id')),
		name: v.string(),
		callbackUrl: v.nullable(v.string()),
		permission: v.pipe(v.array(v.string()), mi.uniqueArray()),
		isAuthorized: v.optional(v.boolean()),
	})),
} as const;

export const paramDef = v.object({
	limit: mi.limit({ max: 100, def: 10 }),
	offset: v.optional(mi.integer(), 0),
	sort: v.optional(v.picklist(['desc', 'asc']), 'desc'),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private appEntityService: AppEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get tokens
			const tokens = await this.accessTokensRepository.find({
				where: {
					userId: me.id,
					appId: Not(IsNull()),
				},
				take: ps.limit,
				skip: ps.offset,
				order: {
					id: ps.sort === 'asc' ? 1 : -1,
				},
			});

			return await Promise.all(tokens.map(token => this.appEntityService.pack(token.appId!, me, {
				detail: true,
			})));
		});
	}
}
