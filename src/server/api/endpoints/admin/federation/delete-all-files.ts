import $ from 'cafy';
import define from '../../../define';
import { deleteFile } from '../../../../../services/drive/delete-file';
import { DriveFiles } from '../../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定したドメインのファイルを全て削除します。',
		'en-US': 'Deletes all files in the specified domain.'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		host: {
			validator: $.str
		}
	}
};

export default define(meta, async (ps, me) => {
	const files = await DriveFiles.find({
		userHost: ps.host
	});

	for (const file of files) {
		deleteFile(file);
	}
});
