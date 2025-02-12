/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { NoteMutingService } from '@/core/note/NoteMutingService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchItem: {
			message: 'No such item.',
			code: 'NO_SUCH_ITEM',
			id: '6ad3b6c9-f173-60f7-b558-5eea13896254',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
	},
	required: ['id'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private readonly noteMutingService: NoteMutingService,
	) {
		super(meta, paramDef, async (ps) => {
			try {
				// Existence check
				await this.noteMutingService.get(ps.id);
			} catch (e) {
				if (e instanceof NoteMutingService.NoSuchItemError) {
					throw new ApiError(meta.errors.noSuchItem);
				}

				throw e;
			}

			await this.noteMutingService.delete(ps.id);
		});
	}
}
