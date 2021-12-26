import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { createImportBlockingJob } from '@/queue/index';
import ms from 'ms';
import { ApiError } from '../../error';
import { DriveFiles } from '@/models/index';

export const meta = {
	secure: true,
	requireCredential: true as const,

	limit: {
		duration: ms('1hour'),
		max: 1,
	},

	params: {
		fileId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'ebb53e5f-6574-9c0c-0b92-7ca6def56d7e',
		},

		unexpectedFileType: {
			message: 'We need csv file.',
			code: 'UNEXPECTED_FILE_TYPE',
			id: 'b6fab7d6-d945-d67c-dfdb-32da1cd12cfe',
		},

		tooBigFile: {
			message: 'That file is too big.',
			code: 'TOO_BIG_FILE',
			id: 'b7fbf0b1-aeef-3b21-29ef-fadd4cb72ccf',
		},

		emptyFile: {
			message: 'That file is empty.',
			code: 'EMPTY_FILE',
			id: '6f3a4dcc-f060-a707-4950-806fbdbe60d6',
		},
	},
};

export default define(meta, async (ps, user) => {
	const file = await DriveFiles.findOne(ps.fileId);

	if (file == null) throw new ApiError(meta.errors.noSuchFile);
	//if (!file.type.endsWith('/csv')) throw new ApiError(meta.errors.unexpectedFileType);
	if (file.size > 50000) throw new ApiError(meta.errors.tooBigFile);
	if (file.size === 0) throw new ApiError(meta.errors.emptyFile);

	createImportBlockingJob(user, file.id);
});
