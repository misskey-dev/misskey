/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { DriveService } from '@/core/DriveService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	errors: {
	},
} as const;

export const paramDef = v.object({
	fileIds: v.pipe(v.array(mi.misskeyId()), mi.uniqueArray(), v.minLength(1), v.maxLength(100)),
	folderId: v.optional(v.nullable(mi.misskeyId())),
});

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
