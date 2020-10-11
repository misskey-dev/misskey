import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { DriveFiles } from '../../../../../models';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		fileId: {
			validator: $.optional.type(ID),
		},

		url: {
			validator: $.optional.str,
		},
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'caf3ca38-c6e5-472e-a30c-b05377dcc240'
		}
	}
};

export default define(meta, async (ps, me) => {
	const file = ps.fileId ? await DriveFiles.findOne(ps.fileId) : await DriveFiles.findOne({
		where: [{
			url: ps.url
		}, {
			thumbnailUrl: ps.url
		}, {
			webpublicUrl: ps.url
		}]
	});

	if (file == null) {
		throw new ApiError(meta.errors.noSuchFile);
	}

	return file;
});
