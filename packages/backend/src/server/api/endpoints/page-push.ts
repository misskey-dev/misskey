/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { PagesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { Schema } from '@/misc/json-schema.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../error.js';

export const meta = {
	requireCredential: true,
	secure: true,

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: '4a13ad31-6729-46b4-b9af-e86b265c2e74',
		},
	},
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {
		pageId: { type: 'string', format: 'misskey:id' },
		event: { type: 'string' },
		var: {},
	},
	required: ['pageId', 'event'],
} as const satisfies Schema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const page = await this.pagesRepository.findOneBy({ id: ps.pageId });
			if (page == null) {
				throw new ApiError(meta.errors.noSuchPage);
			}

			this.globalEventService.publishMainStream(page.userId, 'pageEvent', {
				pageId: ps.pageId,
				event: ps.event,
				var: ps.var,
				userId: me.id,
				user: await this.userEntityService.pack(me.id, { id: page.userId }, {
					schema: 'UserDetailed',
				}),
			});
		});
	}
}
