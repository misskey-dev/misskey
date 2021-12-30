import $ from 'cafy';
import define from '../../define';
import { deleteFile } from '@/services/drive/delete-file';
import { DriveFiles } from '@/models/index';
import { ID } from '@/misc/cafy-id';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		userId: {
			validator: $.type(ID),
		},
	},
};

export default define(meta, async (ps, me) => {
	const files = await DriveFiles.find({
		userId: ps.userId,
	});

	for (const file of files) {
		deleteFile(file);
	}
});
