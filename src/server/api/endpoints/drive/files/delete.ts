import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import { deleteFile } from '../../../../../services/drive/delete-file';
import { publishDriveStream } from '../../../../../services/stream';
import define from '../../../define';
import { ApiError } from '../../../error';
import { DriveFiles } from '../../../../../models';

export const meta = {
	desc: {
		'ja-JP': 'ドライブのファイルを削除します。',
		'en-US': 'Delete a file of drive.'
	},

	tags: ['drive'],

	requireCredential: true as const,

	kind: 'write:drive',

	params: {
		fileId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のファイルID',
				'en-US': 'Target file ID'
			}
		}
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '908939ec-e52b-4458-b395-1025195cea58'
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '5eb8d909-2540-4970-90b8-dd6f86088121'
		},
	}
};

export default define(meta, async (ps, user) => {
	const file = await DriveFiles.findOne(ps.fileId);

	if (file == null) {
		throw new ApiError(meta.errors.noSuchFile);
	}

	if (!user.isAdmin && !user.isModerator && (file.userId !== user.id)) {
		throw new ApiError(meta.errors.accessDenied);
	}

	// Delete
	await deleteFile(file);

	// Publish fileDeleted event
	publishDriveStream(user.id, 'fileDeleted', file.id);
});
