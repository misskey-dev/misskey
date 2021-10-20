import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { createImportMutingJob } from '@/queue/index';
import * as ms from 'ms';
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
		}
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'e674141e-bd2a-ba85-e616-aefb187c9c2a'
		},

		unexpectedFileType: {
			message: 'We need csv file.',
			code: 'UNEXPECTED_FILE_TYPE',
			id: '568c6e42-c86c-ba09-c004-517f83f9f1a8'
		},

		tooBigFile: {
			message: 'That file is too big.',
			code: 'TOO_BIG_FILE',
			id: '9b4ada6d-d7f7-0472-0713-4f558bd1ec9c'
		},

		emptyFile: {
			message: 'That file is empty.',
			code: 'EMPTY_FILE',
			id: 'd2f12af1-e7b4-feac-86a3-519548f2728e'
		},
	}
};

export default define(meta, async (ps, user) => {
	const file = await DriveFiles.findOne(ps.fileId);

	if (file == null) throw new ApiError(meta.errors.noSuchFile);
	//if (!file.type.endsWith('/csv')) throw new ApiError(meta.errors.unexpectedFileType);
	if (file.size > 50000) throw new ApiError(meta.errors.tooBigFile);
	if (file.size === 0) throw new ApiError(meta.errors.emptyFile);

	createImportMutingJob(user, file.id);
});
