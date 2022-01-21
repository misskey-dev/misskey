import $ from 'cafy';
import define from '../../define';
import { deleteFile } from '@/services/drive/delete-file';
import { DriveFiles } from '@/models/index';
import { ID } from '@/misc/cafy-id';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const files = await DriveFiles.find({
		userId: ps.userId,
	});

	for (const file of files) {
		deleteFile(file);
	}
});
