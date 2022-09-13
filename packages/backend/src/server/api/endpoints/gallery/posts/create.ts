import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DriveFiles, GalleryPosts } from '@/models/index.js';
import { GalleryPost } from '@/models/entities/gallery-post.js';
import type { DriveFile } from '@/models/entities/drive-file.js';
import { genId } from '../../../../../misc/gen-id.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	kind: 'write:gallery',

	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'GalleryPost',
	},

	errors: {

	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		title: { type: 'string', minLength: 1 },
		description: { type: 'string', nullable: true },
		fileIds: { type: 'array', uniqueItems: true, minItems: 1, maxItems: 32, items: {
			type: 'string', format: 'misskey:id',
		} },
		isSensitive: { type: 'boolean', default: false },
	},
	required: ['title', 'fileIds'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
	) {
		super(meta, paramDef, async (ps, me) => {
			const files = (await Promise.all(ps.fileIds.map(fileId =>
				DriveFiles.findOneBy({
					id: fileId,
					userId: me.id,
				}),
			))).filter((file): file is DriveFile => file != null);

			if (files.length === 0) {
				throw new Error();
			}

			const post = await GalleryPosts.insert(new GalleryPost({
				id: this.idService.genId(),
				createdAt: new Date(),
				updatedAt: new Date(),
				title: ps.title,
				description: ps.description,
				userId: me.id,
				isSensitive: ps.isSensitive,
				fileIds: files.map(file => file.id),
			})).then(x => GalleryPosts.findOneByOrFail(x.identifiers[0]));

			return await GalleryPosts.pack(post, me);
		});
	}
}
