import ms from 'ms';
import define from '../../../define.js';
import { DriveFiles, GalleryPosts } from '@/models/index.js';
import { genId } from '../../../../../misc/gen-id.js';
import { GalleryPost } from '@/models/entities/gallery-post.js';
import { ApiError } from '../../../error.js';
import { DriveFile } from '@/models/entities/drive-file.js';

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
export default define(meta, paramDef, async (ps, user) => {
	const files = (await Promise.all(ps.fileIds.map(fileId =>
		DriveFiles.findOneBy({
			id: fileId,
			userId: user.id,
		})
	))).filter((file): file is DriveFile => file != null);

	if (files.length === 0) {
		throw new Error();
	}

	const post = await GalleryPosts.insert(new GalleryPost({
		id: genId(),
		createdAt: new Date(),
		updatedAt: new Date(),
		title: ps.title,
		description: ps.description,
		userId: user.id,
		isSensitive: ps.isSensitive,
		fileIds: files.map(file => file.id),
	})).then(x => GalleryPosts.findOneByOrFail(x.identifiers[0]));

	return await GalleryPosts.pack(post, user);
});
