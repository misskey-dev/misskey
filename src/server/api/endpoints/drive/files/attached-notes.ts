import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { DriveFiles, Notes } from '@/models/index';

export const meta = {
	tags: ['drive', 'notes'],

	requireCredential: true as const,

	kind: 'read:drive',

	params: {
		fileId: {
			validator: $.type(ID),
		}
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Note',
		}
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'c118ece3-2e4b-4296-99d1-51756e32d232',
		}
	}
};

export default define(meta, async (ps, user) => {
	// Fetch file
	const file = await DriveFiles.findOne({
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
		detail: true
	});
});
