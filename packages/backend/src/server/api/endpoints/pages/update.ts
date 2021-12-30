import $ from 'cafy';
import ms from 'ms';
import define from '../../define';
import { ApiError } from '../../error';
import { Pages, DriveFiles } from '@/models/index';
import { ID } from '@/misc/cafy-id';
import { Not } from 'typeorm';

export const meta = {
	tags: ['pages'],

	requireCredential: true as const,

	kind: 'write:pages',

	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	params: {
		pageId: {
			validator: $.type(ID),
		},

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
			validator: $.arr($.obj()),
		},

		variables: {
			validator: $.arr($.obj()),
		},

		script: {
			validator: $.str,
		},

		eyeCatchingImageId: {
			validator: $.optional.nullable.type(ID),
		},

		font: {
			validator: $.optional.str.or(['serif', 'sans-serif']),
		},

		alignCenter: {
			validator: $.optional.bool,
		},

		hideTitleWhenPinned: {
			validator: $.optional.bool,
		},
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
};

export default define(meta, async (ps, user) => {
	const page = await Pages.findOne(ps.pageId);
	if (page == null) {
		throw new ApiError(meta.errors.noSuchPage);
	}
	if (page.userId !== user.id) {
		throw new ApiError(meta.errors.accessDenied);
	}

	let eyeCatchingImage = null;
	if (ps.eyeCatchingImageId != null) {
		eyeCatchingImage = await DriveFiles.findOne({
			id: ps.eyeCatchingImageId,
			userId: user.id,
		});

		if (eyeCatchingImage == null) {
			throw new ApiError(meta.errors.noSuchFile);
		}
	}

	await Pages.find({
		id: Not(ps.pageId),
		userId: user.id,
		name: ps.name,
	}).then(result => {
		if (result.length > 0) {
			throw new ApiError(meta.errors.nameAlreadyExists);
		}
	});

	await Pages.update(page.id, {
		updatedAt: new Date(),
		title: ps.title,
		name: ps.name === undefined ? page.name : ps.name,
		summary: ps.name === undefined ? page.summary : ps.summary,
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
