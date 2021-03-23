import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { DriveFolders } from '../../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定したドライブのフォルダの情報を取得します。',
		'en-US': 'Get specified folder of drive.'
	},

	tags: ['drive'],

	requireCredential: true as const,

	kind: 'read:drive',

	params: {
		folderId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のフォルダID',
				'en-US': 'Target folder ID'
			}
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'DriveFolder',
	},

	errors: {
		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: 'd74ab9eb-bb09-4bba-bf24-fb58f761e1e9'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Get folder
	const folder = await DriveFolders.findOne({
		id: ps.folderId,
		userId: user.id
	});

	if (folder == null) {
		throw new ApiError(meta.errors.noSuchFolder);
	}

	return await DriveFolders.pack(folder, {
		detail: true
	});
});
