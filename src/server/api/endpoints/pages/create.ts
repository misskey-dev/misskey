import $ from 'cafy';
import * as ms from 'ms';
import define from '../../define';
import { ID } from '../../../../misc/cafy-id';
import { Pages, DriveFiles } from '../../../../models';
import { genId } from '../../../../misc/gen-id';
import { Page } from '../../../../models/entities/page';
import { ApiError } from '../../error';

export const meta = {
	desc: {
		'ja-JP': 'ページを作成します。',
	},

	tags: ['pages'],

	requireCredential: true,

	kind: 'write:pages',

	limit: {
		duration: ms('1hour'),
		max: 300
	},

	params: {
		title: {
			validator: $.str,
		},

		name: {
			validator: $.str.min(1),
		},

		summary: {
			validator: $.optional.nullable.str,
		},

		content: {
			validator: $.arr($.obj())
		},

		variables: {
			validator: $.arr($.obj())
		},

		eyeCatchingImageId: {
			validator: $.optional.nullable.type(ID),
		},

		font: {
			validator: $.optional.str.or(['serif', 'sans-serif']),
			default: 'sans-serif'
		},

		alignCenter: {
			validator: $.optional.bool,
			default: false
		},

		hideTitleWhenPinned: {
			validator: $.optional.bool,
			default: false
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'Page',
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'b7b97489-0f66-4b12-a5ff-b21bd63f6e1c'
		},
		nameAlreadyExists: {
			message: 'Specified name already exists.',
			code: 'NAME_ALREADY_EXISTS',
			id: '4650348e-301c-499a-83c9-6aa988c66bc1'
		}
	}
};

export default define(meta, async (ps, user) => {
	let eyeCatchingImage = null;
	if (ps.eyeCatchingImageId != null) {
		eyeCatchingImage = await DriveFiles.findOne({
			id: ps.eyeCatchingImageId,
			userId: user.id
		});

		if (eyeCatchingImage == null) {
			throw new ApiError(meta.errors.noSuchFile);
		}
	}

	await Pages.find({
		userId: user.id,
		name: ps.name
	}).then(result => {
		if (result.length > 0) {
			throw new ApiError(meta.errors.nameAlreadyExists);
		}
	});

	const page = await Pages.save(new Page({
		id: genId(),
		createdAt: new Date(),
		updatedAt: new Date(),
		title: ps.title,
		name: ps.name,
		summary: ps.summary,
		content: ps.content,
		variables: ps.variables,
		eyeCatchingImageId: eyeCatchingImage ? eyeCatchingImage.id : null,
		userId: user.id,
		visibility: 'public',
		alignCenter: ps.alignCenter,
		hideTitleWhenPinned: ps.hideTitleWhenPinned,
		font: ps.font
	}));

	return await Pages.pack(page);
});
