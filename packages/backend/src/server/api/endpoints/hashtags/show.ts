/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { Schema } from '@/misc/json-schema.js';
import type { HashtagsRepository } from '@/models/_.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { HashtagEntityService } from '@/core/entities/HashtagEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Hashtag',
	},

	errors: {
		noSuchHashtag: {
			message: 'No such hashtag.',
			code: 'NO_SUCH_HASHTAG',
			id: '110ee688-193e-4a3a-9ecf-c167b2e6981e',
		},
	},
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {
		tag: { type: 'string' },
	},
	required: ['tag'],
} as const satisfies Schema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.hashtagsRepository)
		private hashtagsRepository: HashtagsRepository,

		private hashtagEntityService: HashtagEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const hashtag = await this.hashtagsRepository.findOneBy({ name: normalizeForSearch(ps.tag) });
			if (hashtag == null) {
				throw new ApiError(meta.errors.noSuchHashtag);
			}

			return await this.hashtagEntityService.pack(hashtag);
		});
	}
}
