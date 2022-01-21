import $ from 'cafy';
import define from '../../../define';
import { deleteFile } from '@/services/drive/delete-file';
import { DriveFiles } from '@/models/index';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		host: {
			validator: $.str,
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const files = await DriveFiles.find({
		userHost: ps.host,
	});

	for (const file of files) {
		deleteFile(file);
	}
});
