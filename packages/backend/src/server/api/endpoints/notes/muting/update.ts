/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import ms from 'ms';
import { NoteMutingService } from '@/core/note/NoteMutingService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	kind: 'write:account',

	limit: {
		duration: ms('1hour'),
		max: 10,
	},

	errors: {
		noSuchItem: {
			message: 'No such item.',
			code: 'NO_SUCH_ITEM',
			id: '502ce7a1-d8b0-7094-78e2-ff5b8190efc9',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
		expiresAt: { type: 'integer', nullable: true },
	},
	required: ['id'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private readonly noteMutingService: NoteMutingService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				// Existence check
				await this.noteMutingService.get(ps.id);
			} catch (e) {
				if (e instanceof NoteMutingService.NoSuchItemError) {
					throw new ApiError(meta.errors.noSuchItem);
				}

				throw e;
			}

			await this.noteMutingService.update(ps.id, {
				expiresAt: ps.expiresAt ? new Date(ps.expiresAt) : null,
			});
		});
	}
}
