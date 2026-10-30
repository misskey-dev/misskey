/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AccessTokensRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	requireCredential: true,

	secure: true,

	res: v.array(v.object({
		id: v.pipe(v.string(), mi.format('misskey:id')),
		name: v.optional(v.string()),
		createdAt: mi.dateTimeString(),
		lastUsedAt: v.optional(mi.dateTimeString()),
		permission: v.pipe(v.array(v.string()), mi.uniqueArray()),
		iconUrl: v.optional(v.nullable(v.string())),
		description: v.optional(v.nullable(v.string())),
	})),
} as const;

export const paramDef = v.object({
	sort: v.optional(v.picklist(['+createdAt', '-createdAt', '+lastUsedAt', '-lastUsedAt'])),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.accessTokensRepository.createQueryBuilder('token')
				.where('token.userId = :userId', { userId: me.id })
				.leftJoinAndSelect('token.app', 'app');

			switch (ps.sort) {
				case '+createdAt': query.orderBy('token.id', 'DESC'); break;
				case '-createdAt': query.orderBy('token.id', 'ASC'); break;
				case '+lastUsedAt': query.orderBy('token.lastUsedAt', 'DESC'); break;
				case '-lastUsedAt': query.orderBy('token.lastUsedAt', 'ASC'); break;
				default: query.orderBy('token.id', 'ASC'); break;
			}

			const tokens = await query.getMany();

			return await Promise.all(tokens.map(token => ({
				id: token.id,
				name: token.name ?? token.app?.name,
				createdAt: this.idService.parse(token.id).date.toISOString(),
				lastUsedAt: token.lastUsedAt?.toISOString(),
				permission: token.app ? token.app.permission : token.permission,
				iconUrl: token.iconUrl,
				description: token.description ?? token.app?.description ?? null,
			})));
		});
	}
}
