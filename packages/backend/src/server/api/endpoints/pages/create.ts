/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import type { DriveFilesRepository, MiDriveFile, PagesRepository } from '@/models/_.js';
import { pageNameSchema } from '@/models/Page.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { PageEntityService } from '@/core/entities/PageEntityService.js';
import { DI } from '@/di-symbols.js';
import { PageService } from '@/core/PageService.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { packedPageSchema } from '@/models/schema/page.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['pages'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:pages',

	limit: {
		duration: ms('1hour'),
		max: 10,
	},

	res: packedPageSchema,

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'b7b97489-0f66-4b12-a5ff-b21bd63f6e1c',
		},
		nameAlreadyExists: {
			message: 'Specified name already exists.',
			code: 'NAME_ALREADY_EXISTS',
			id: '4650348e-301c-499a-83c9-6aa988c66bc1',
		},
	},
} as const;

export const paramDef = v.object({
	title: v.string(),
	name: v.pipe(v.string(), v.regex(new RegExp(pageNameSchema.pattern)), mi.minCodePoints(1)),
	summary: v.optional(v.nullable(v.string())),
	content: v.array(mi.anyRecord()),
	variables: v.array(mi.anyRecord()),
	script: v.string(),
	eyeCatchingImageId: v.optional(v.nullable(mi.misskeyId())),
	font: v.optional(v.picklist(['serif', 'sans-serif']), 'sans-serif'),
	alignCenter: v.optional(v.boolean(), false),
	hideTitleWhenPinned: v.optional(v.boolean(), false),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private pageService: PageService,
		private pageEntityService: PageEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let eyeCatchingImage: MiDriveFile | null = null;
			if (ps.eyeCatchingImageId != null) {
				eyeCatchingImage = await this.driveFilesRepository.findOneBy({
					id: ps.eyeCatchingImageId,
					userId: me.id,
				});

				if (eyeCatchingImage == null) {
					throw new ApiError(meta.errors.noSuchFile);
				}
			}

			await this.pagesRepository.findBy({
				userId: me.id,
				name: ps.name,
			}).then(result => {
				if (result.length > 0) {
					throw new ApiError(meta.errors.nameAlreadyExists);
				}
			});

			try {
				const page = await this.pageService.create(me, {
					...ps,
					eyeCatchingImage,
					summary: ps.summary ?? null,
				});

				return await this.pageEntityService.pack(page);
			} catch (err) {
				if (err instanceof IdentifiableError && err.id === '1a79e38e-3d83-4423-845b-a9d83ff93b61') {
					throw new ApiError(meta.errors.nameAlreadyExists);
				}
				throw err;
			}
		});
	}
}
