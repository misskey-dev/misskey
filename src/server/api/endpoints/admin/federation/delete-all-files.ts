import $ from 'cafy';
import define from '../../../define';
import del from '../../../../../services/drive/delete-file';
import { DriveFiles } from '../../../../../models';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
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
		del(file);
	}
});
