import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import define from '../../define';
import { createImportFollowingJob } from '../../../../queue';
import ms = require('ms');
import DriveFile from '../../../../models/drive-file';
import { ApiError } from '../../error';

export const meta = {
	secure: true,
	requireCredential: true,
	limit: {
		duration: ms('1hour'),
		max: 1,
	},

	params: {
		fileId: {
			validator: $.type(ID),
			transform: transform,
		}
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'b98644cf-a5ac-4277-a502-0b8054a709a3'
		},

		unexpectedFileType: {
			message: 'We need csv file.',
			code: 'UNEXPECTED_FILE_TYPE',
			id: '660f3599-bce0-4f95-9dde-311fd841c183'
		},

		tooBigFile: {
			message: 'That file is too big.',
			code: 'TOO_BIG_FILE',
			id: 'dee9d4ed-ad07-43ed-8b34-b2856398bc60'
		},

		emptyFile: {
			message: 'That file is empty.',
			code: 'EMPTY_FILE',
			id: '31a1b42c-06f7-42ae-8a38-a661c5c9f691'
		},
	}
};

export default define(meta, async (ps, user) => {
	const file = await DriveFile.findOne({
		_id: ps.fileId
	});

	if (file == null) throw new ApiError(meta.errors.noSuchFile);
	//if (!file.contentType.endsWith('/csv')) throw new ApiError(meta.errors.unexpectedFileType);
	if (file.length > 50000) throw new ApiError(meta.errors.tooBigFile);
	if (file.length === 0) throw new ApiError(meta.errors.emptyFile);

	createImportFollowingJob(user, file._id);

	return;
});
