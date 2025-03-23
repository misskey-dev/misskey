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
		notMuted: {
			message: 'Not muted.',
			code: 'NOT_MUTED',
			id: '6ad3b6c9-f173-60f7-b558-5eea13896254',
			httpStatusCode: 400,
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private readonly noteMutingService: NoteMutingService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				await this.noteMutingService.delete(me.id, ps.noteId);
			} catch (e) {
				if (e instanceof NoteMutingService.NotMutedError) {
					throw new ApiError(meta.errors.notMuted);
				} else {
					throw e;
				}
			}
		});
	}
}
