/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'crypto';
import ms from 'ms';
import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { ApiError } from '../error.js';

export const meta = {
	tags: ['meta'],

	requireCredential: true,

	limit: {
		duration: ms('1hour'),
		max: 50,
	},

	errors: {
		invalidSchema: {
			message: 'External resource returned invalid schema.',
			code: 'EXT_RESOURCE_RETURNED_INVALID_SCHEMA',
			id: 'bb774091-7a15-4a70-9dc5-6ac8cf125856',
		},
		hashUnmached: {
			message: 'Hash did not match.',
			code: 'EXT_RESOURCE_HASH_DIDNT_MATCH',
			id: '693ba8ba-b486-40df-a174-72f8279b56a4',
		},
	},

	res: {
		type: 'object',
		properties: {
			type: {
				type: 'string',
			},
			data: {
				type: 'string',
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		url: { type: 'string' },
		hash: { type: 'string' },
	},
	required: ['url', 'hash'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private httpRequestService: HttpRequestService,
	) {
		super(meta, paramDef, async (ps) => {
			const res = await this.httpRequestService.getJson<{
				type: string;
				data: string;
			}>(ps.url);

			if (!res.data || !res.type) {
				throw new ApiError(meta.errors.invalidSchema);
			}

			const resHash = createHash('sha512').update(res.data.replace(/\r\n/g, '\n')).digest('hex');
			if (resHash !== ps.hash) {
				throw new ApiError(meta.errors.hashUnmached);
			}

			return {
				type: res.type,
				data: res.data,
			};
		});
	}
}
