import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { createImportUserListsJob } from '@/queue/index';
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
			id: 'ea9cc34f-c415-4bc6-a6fe-28ac40357049'
		},

		unexpectedFileType: {
			message: 'We need csv file.',
			code: 'UNEXPECTED_FILE_TYPE',
			id: 'a3c9edda-dd9b-4596-be6a-150ef813745c'
		},

		tooBigFile: {
			message: 'That file is too big.',
			code: 'TOO_BIG_FILE',
			id: 'ae6e7a22-971b-4b52-b2be-fc0b9b121fe9'
		},

		emptyFile: {
			message: 'That file is empty.',
			code: 'EMPTY_FILE',
			id: '99efe367-ce6e-4d44-93f8-5fae7b040356'
		},
	}
};

export default define(meta, async (ps, user) => {
	const file = await DriveFiles.findOne(ps.fileId);

	if (file == null) throw new ApiError(meta.errors.noSuchFile);
	//if (!file.type.endsWith('/csv')) throw new ApiError(meta.errors.unexpectedFileType);
	if (file.size > 30000) throw new ApiError(meta.errors.tooBigFile);
	if (file.size === 0) throw new ApiError(meta.errors.emptyFile);

	createImportUserListsJob(user, file.id);
});
