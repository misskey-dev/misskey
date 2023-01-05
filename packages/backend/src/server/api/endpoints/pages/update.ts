import ms from 'ms';
import { Not } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { PagesRepository, DriveFilesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['pages'],

	requireCredential: true,

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

export const paramDef = {
	type: 'object',
	properties: {
		pageId: { type: 'string', format: 'misskey:id' },
		title: { type: 'string' },
		name: { type: 'string', minLength: 1 },
		summary: { type: 'string', nullable: true },
		content: { type: 'array', items: {
			type: 'object', additionalProperties: true,
		} },
		variables: { type: 'array', items: {
			type: 'object', additionalProperties: true,
		} },
		script: { type: 'string' },
		eyeCatchingImageId: { type: 'string', format: 'misskey:id', nullable: true },
		font: { type: 'string', enum: ['serif', 'sans-serif'] },
		alignCenter: { type: 'boolean' },
		hideTitleWhenPinned: { type: 'boolean' },
	},
	required: ['pageId', 'title', 'name', 'content', 'variables', 'script'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const page = await this.pagesRepository.findOneBy({ id: ps.pageId });
			if (page == null) {
				throw new ApiError(meta.errors.noSuchPage);
			}
			if (page.userId !== me.id) {
				throw new ApiError(meta.errors.accessDenied);
			}

			let eyeCatchingImage = null;
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
				id: Not(ps.pageId),
				userId: me.id,
				name: ps.name,
			}).then(result => {
				if (result.length > 0) {
					throw new ApiError(meta.errors.nameAlreadyExists);
				}
			});

			await this.pagesRepository.update(page.id, {
				updatedAt: new Date(),
				title: ps.title,
				name: ps.name === undefined ? page.name : ps.name,
				summary: ps.summary === undefined ? page.summary : ps.summary,
				content: ps.content,
				variables: ps.variables,
				script: ps.script,
				alignCenter: ps.alignCenter === undefined ? page.alignCenter : ps.alignCenter,
				hideTitleWhenPinned: ps.hideTitleWhenPinned === undefined ? page.hideTitleWhenPinned : ps.hideTitleWhenPinned,
				font: ps.font === undefined ? page.font : ps.font,
				eyeCatchingImageId: ps.eyeCatchingImageId === null
					? null
					: ps.eyeCatchingImageId === undefined
						? page.eyeCatchingImageId
						: eyeCatchingImage!.id,
			});
		});
	}
}
