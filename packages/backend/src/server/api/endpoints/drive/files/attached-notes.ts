import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { DriveFiles, Notes } from '@/models/index.js';

export const meta = {
	tags: ['drive', 'notes'],

	requireCredential: true,

	kind: 'read:drive',

	description: 'Find the notes to which the given file is attached.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'c118ece3-2e4b-4296-99d1-51756e32d232',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		fileId: { type: 'string', format: 'misskey:id' },
	},
	required: ['fileId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Fetch file
	const file = await DriveFiles.findOneBy({
		id: ps.fileId,
		userId: user.id,
	});

	if (file == null) {
		throw new ApiError(meta.errors.noSuchFile);
	}

	const notes = await Notes.createQueryBuilder('note')
		.where(':file = ANY(note.fileIds)', { file: file.id })
		.getMany();

	return await Notes.packMany(notes, user, {
		detail: true,
	});
});
