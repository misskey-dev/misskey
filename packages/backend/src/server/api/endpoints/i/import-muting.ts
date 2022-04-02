import define from '../../define.js';
import { createImportMutingJob } from '@/queue/index.js';
import ms from 'ms';
import { ApiError } from '../../error.js';
import { DriveFiles } from '@/models/index.js';

export const meta = {
	secure: true,
	requireCredential: true,

	limit: {
		duration: ms('1hour'),
		max: 1,
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'e674141e-bd2a-ba85-e616-aefb187c9c2a',
		},

		unexpectedFileType: {
			message: 'We need csv file.',
			code: 'UNEXPECTED_FILE_TYPE',
			id: '568c6e42-c86c-ba09-c004-517f83f9f1a8',
		},

		tooBigFile: {
			message: 'That file is too big.',
			code: 'TOO_BIG_FILE',
			id: '9b4ada6d-d7f7-0472-0713-4f558bd1ec9c',
		},

		emptyFile: {
			message: 'That file is empty.',
			code: 'EMPTY_FILE',
			id: 'd2f12af1-e7b4-feac-86a3-519548f2728e',
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
	const file = await DriveFiles.findOneBy({ id: ps.fileId });

	if (file == null) throw new ApiError(meta.errors.noSuchFile);
	//if (!file.type.endsWith('/csv')) throw new ApiError(meta.errors.unexpectedFileType);
	if (file.size > 50000) throw new ApiError(meta.errors.tooBigFile);
	if (file.size === 0) throw new ApiError(meta.errors.emptyFile);

	createImportMutingJob(user, file.id);
});
