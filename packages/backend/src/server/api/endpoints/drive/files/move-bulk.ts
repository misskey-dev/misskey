/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { DriveService } from '@/core/DriveService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		fileIds: { type: 'array', uniqueItems: true, minItems: 1, maxItems: 100, items: { type: 'string', format: 'misskey:id' } },
		folderId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: ['fileIds'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private driveService: DriveService,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.driveService.moveFiles(ps.fileIds, ps.folderId ?? null, me.id);
		});
	}
}
