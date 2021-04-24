import $ from 'cafy';
import * as ms from 'ms';
import define from '../../../define';
import { ID } from '../../../../../misc/cafy-id';
import { DriveFiles, GalleryPosts } from '../../../../../models';
import { genId } from '../../../../../misc/gen-id';
import { GalleryPost } from '../../../../../models/entities/gallery-post';
import { ApiError } from '../../../error';

export const meta = {
	tags: ['gallery'],

	requireCredential: true as const,

	kind: 'write:gallery',

	limit: {
		duration: ms('1hour'),
		max: 300
	},

	params: {
		title: {
			validator: $.str.min(1),
		},

		description: {
			validator: $.optional.nullable.str,
		},

		fileIds: {
			validator: $.arr($.type(ID)).unique().range(1, 32),
		},

		isSensitive: {
			validator: $.optional.bool,
			default: false,
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'GalleryPost',
	},

	errors: {

	}
};

export default define(meta, async (ps, user) => {
	const files = (await Promise.all(ps.fileIds.map(fileId =>
		DriveFiles.findOne({
			id: fileId,
			userId: user.id
		})
	))).filter(file => file != null);

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
		fileIds: files.map(file => file.id)
	})).then(x => GalleryPosts.findOneOrFail(x.identifiers[0]));

	return await GalleryPosts.pack(post);
});
