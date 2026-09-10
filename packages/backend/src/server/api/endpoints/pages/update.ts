/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import type { DriveFilesRepository, MiDriveFile } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';
import { pageNameSchema } from '@/models/Page.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { PageService } from '@/core/PageService.js';

export const meta = {
	tags: ['pages'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:pages',

	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: '21149b9e-3616-4778-9592-c4ce89f5a864',
		},
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '3c15cd52-3b4b-4274-967d-6456fc4f792b',
		},
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'cfc23c7c-3887-490e-af30-0ed576703c82',
		},
		nameAlreadyExists: {
			message: 'Specified name already exists.',
			code: 'NAME_ALREADY_EXISTS',
			id: '2298a392-d4a1-44c5-9ebb-ac1aeaa5a9ab',
		},
	},
} as const;

export const paramDef = v.object({
	pageId: mi.misskeyId(),
	title: v.optional(v.string()),
	name: v.optional(v.pipe(v.string(), v.regex(new RegExp(pageNameSchema.pattern)), mi.minCodePoints(1))),
	summary: v.optional(v.nullable(v.string())),
	content: v.optional(v.array(mi.anyRecord())),
	variables: v.optional(v.array(mi.anyRecord())),
	script: v.optional(v.string()),
	eyeCatchingImageId: v.optional(v.nullable(mi.misskeyId())),
	font: v.optional(v.picklist(['serif', 'sans-serif'])),
	alignCenter: v.optional(v.boolean()),
	hideTitleWhenPinned: v.optional(v.boolean()),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private pageService: PageService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				let eyeCatchingImage: MiDriveFile | null | undefined | string = ps.eyeCatchingImageId;
				if (eyeCatchingImage != null) {
					eyeCatchingImage = await this.driveFilesRepository.findOneBy({
						id: eyeCatchingImage,
						userId: me.id,
					});

					if (eyeCatchingImage == null) {
						throw new ApiError(meta.errors.noSuchFile);
					}
				}

				await this.pageService.update(me, ps.pageId, {
					...ps,
					eyeCatchingImage,
				});
			} catch (err) {
				if (err instanceof IdentifiableError) {
					if (err.id === '66aefd3c-fdb2-4a71-85ae-cc18bea85d3f') throw new ApiError(meta.errors.noSuchPage);
					if (err.id === 'd0017699-8256-46f1-aed4-bc03bed73616') throw new ApiError(meta.errors.accessDenied);
					if (err.id === 'd05bfe24-24b6-4ea2-a3ec-87cc9bf4daa4') throw new ApiError(meta.errors.nameAlreadyExists);
				}
				throw err;
			}
		});
	}
}
