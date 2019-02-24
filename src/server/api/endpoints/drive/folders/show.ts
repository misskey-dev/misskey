import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFolder, { pack } from '../../../../../models/drive-folder';
import define from '../../../define';
import { ApiError } from '../../../error';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのフォルダの情報を取得します。',
		'en-US': 'Get specified folder of drive.'
	},

	tags: ['drive'],

	requireCredential: true,

	kind: 'drive-read',

	params: {
		folderId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のフォルダID',
				'en-US': 'Target folder ID'
			}
		}
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
	const folder = await DriveFolder
		.findOne({
			_id: ps.folderId,
			userId: user._id
		});

	if (folder === null) {
		throw new ApiError(meta.errors.noSuchFolder);
	}

	return await pack(folder, {
		detail: true
	});
});
