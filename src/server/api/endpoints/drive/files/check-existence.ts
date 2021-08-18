import $ from 'cafy';
import define from '../../../define';
import { DriveFiles } from '../../../../../models';

export const meta = {
	tags: ['drive'],

	requireCredential: true as const,

	kind: 'read:drive',

	params: {
		md5: {
			validator: $.str,
		}
	},

	res: {
		type: 'boolean' as const,
		optional: false as const, nullable: false as const,
	},
};

export default define(meta, async (ps, user) => {
	const file = await DriveFiles.findOne({
		md5: ps.md5,
		userId: user.id,
	});

	return file != null;
});
