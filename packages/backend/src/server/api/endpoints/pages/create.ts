import ms from 'ms';
import define from '../../define.js';
import { Pages, DriveFiles } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { Page } from '@/models/entities/page.js';
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
		font: { type: 'string', enum: ['serif', 'sans-serif'], default: "sans-serif" },
		alignCenter: { type: 'boolean', default: false },
		hideTitleWhenPinned: { type: 'boolean', default: false },
	},
	required: ['title', 'name', 'content', 'variables', 'script'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	let eyeCatchingImage = null;
	if (ps.eyeCatchingImageId != null) {
		eyeCatchingImage = await DriveFiles.findOneBy({
			id: ps.eyeCatchingImageId,
			userId: user.id,
		});

		if (eyeCatchingImage == null) {
			throw new ApiError(meta.errors.noSuchFile);
		}
	}

	await Pages.findBy({
		userId: user.id,
		name: ps.name,
	}).then(result => {
		if (result.length > 0) {
			throw new ApiError(meta.errors.nameAlreadyExists);
		}
	});

	const page = await Pages.insert(new Page({
		id: genId(),
		createdAt: new Date(),
		updatedAt: new Date(),
		title: ps.title,
		name: ps.name,
		summary: ps.summary,
		content: ps.content,
		variables: ps.variables,
		script: ps.script,
		eyeCatchingImageId: eyeCatchingImage ? eyeCatchingImage.id : null,
		userId: user.id,
		visibility: 'public',
		alignCenter: ps.alignCenter,
		hideTitleWhenPinned: ps.hideTitleWhenPinned,
		font: ps.font,
	})).then(x => Pages.findOneByOrFail(x.identifiers[0]));

	return await Pages.pack(page);
});
