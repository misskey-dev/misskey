/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DriveService } from '@/core/DriveService.js';

export const meta = {
	tags: ['drive'],

	limit: {
		duration: ms('1hour'),
		max: 60,
	},

	description: 'Request the server to download a new drive file from the specified URL.',

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:drive',
} as const;

export const paramDef = v.object({
	url: v.string(),
	folderId: v.optional(v.nullable(mi.misskeyId()), null),
	isSensitive: v.optional(v.boolean(), false),
	comment: v.optional(v.nullable(v.pipe(v.string(), mi.maxCodePoints(512))), null),
	marker: v.optional(v.nullable(v.string()), null),
	force: v.optional(v.boolean(), false),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private driveFileEntityService: DriveFileEntityService,
		private driveService: DriveService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, user, _1, _2, _3, ip, headers) => {
			this.driveService.uploadFromUrl({ url: ps.url, user, folderId: ps.folderId, sensitive: ps.isSensitive, force: ps.force, comment: ps.comment, requestIp: ip, requestHeaders: headers }).then(file => {
				this.driveFileEntityService.pack(file, { self: true }).then(packedFile => {
					this.globalEventService.publishMainStream(user.id, 'urlUploadFinished', {
						marker: ps.marker,
						file: packedFile,
					});
				});
			});
		});
	}
}
