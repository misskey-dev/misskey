import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository, PagesRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { Page } from '@/models/entities/Page.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { PageEntityService } from '@/core/entities/PageEntityService.js';
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
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
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
		font: { type: 'string', enum: ['serif', 'sans-serif'], default: 'sans-serif' },
		alignCenter: { type: 'boolean', default: false },
		hideTitleWhenPinned: { type: 'boolean', default: false },
	},
	required: ['title', 'name', 'content', 'variables', 'script'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private pageEntityService: PageEntityService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
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
				userId: me.id,
				name: ps.name,
			}).then(result => {
				if (result.length > 0) {
					throw new ApiError(meta.errors.nameAlreadyExists);
				}
			});

			const page = await this.pagesRepository.insert(new Page({
				id: this.idService.genId(),
				createdAt: new Date(),
				updatedAt: new Date(),
				title: ps.title,
				name: ps.name,
				summary: ps.summary,
				content: ps.content,
				variables: ps.variables,
				script: ps.script,
				eyeCatchingImageId: eyeCatchingImage ? eyeCatchingImage.id : null,
				userId: me.id,
				visibility: 'public',
				alignCenter: ps.alignCenter,
				hideTitleWhenPinned: ps.hideTitleWhenPinned,
				font: ps.font,
			})).then(x => this.pagesRepository.findOneByOrFail(x.identifiers[0]));

			return await this.pageEntityService.pack(page);
		});
	}
}
