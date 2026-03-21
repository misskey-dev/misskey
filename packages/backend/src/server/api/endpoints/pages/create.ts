/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { In } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository, MiDriveFile, PagesRepository, UsersRepository } from '@/models/_.js';
import { pageNameSchema } from '@/models/Page.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { PageEntityService } from '@/core/entities/PageEntityService.js';
import { DI } from '@/di-symbols.js';
import { PageService } from '@/core/PageService.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
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

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Page',
	},

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
		invalidVisibleUser: {
			message: 'Visible user must be a local user.',
			code: 'INVALID_VISIBLE_USER',
			id: 'a1c7f3b4-8e2d-4f1a-9b6c-3d5e7f8a9b0c',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		title: { type: 'string' },
		name: { ...pageNameSchema, minLength: 1 },
		summary: { type: 'string', nullable: true },
		content: { type: 'array', items: {
			type: 'object', additionalProperties: true,
		} },
		variables: { type: 'array', items: {
			type: 'object', additionalProperties: true,
		} },
		script: { type: 'string' },
		eyeCatchingImageId: { type: 'string', format: 'misskey:id', nullable: true },
		font: { type: 'string', enum: ['serif', 'sans-serif'], default: 'sans-serif' },
		alignCenter: { type: 'boolean', default: false },
		hideTitleWhenPinned: { type: 'boolean', default: false },
		visibility: { type: 'string', enum: ['public', 'followers', 'specified', 'url-only'], default: 'public' },
		visibleUserIds: { type: 'array', items: { type: 'string', format: 'misskey:id' }, default: [] },
	},
	required: ['title', 'name', 'content', 'variables', 'script'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

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

			// visibleUserIdsのローカルユーザーバリデーション
			if (ps.visibility === 'specified' && ps.visibleUserIds != null && ps.visibleUserIds.length > 0) {
				const users = await this.usersRepository.findBy({ id: In(ps.visibleUserIds!) });
				if (users.some(u => u.host != null)) {
					throw new ApiError(meta.errors.invalidVisibleUser);
				}
			}

			// url-only時はPageServiceがslugにUUIDを付与するため、ここでの重複チェックは元のnameで行う
			if (ps.visibility !== 'url-only') {
				await this.pagesRepository.findBy({
					userId: me.id,
					name: ps.name,
				}).then(result => {
					if (result.length > 0) {
						throw new ApiError(meta.errors.nameAlreadyExists);
					}
				});
			}

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
