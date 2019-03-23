import $ from 'cafy';
import { StringID, NumericalID } from '../../../../../misc/cafy-id';
import DriveFolder, { isValidFolderName, pack } from '../../../../../models/drive-folder';
import { publishDriveStream } from '../../../../../services/stream';
import define from '../../../define';
import { ApiError } from '../../../error';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': 'ドライブのフォルダを作成します。',
		'en-US': 'Create a folder of drive.'
	},

	tags: ['drive'],

	requireCredential: true,

	kind: 'drive-write',

	params: {
		name: {
			validator: $.optional.str.pipe(isValidFolderName),
			default: 'Untitled',
			desc: {
				'ja-JP': 'フォルダ名',
				'en-US': 'Folder name'
			}
		},

		parentId: {
			validator: $.optional.nullable.type(NumericalID),
			desc: {
				'ja-JP': '親フォルダID',
				'en-US': 'Parent folder ID'
			}
		}
	},

	errors: {
		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: '53326628-a00d-40a6-a3cd-8975105c0f95'
		},
	}
};

export default define(meta, async (ps, user) => {
	// If the parent folder is specified
	let parent = null;
	if (ps.parentId) {
		// Fetch parent folder
		parent = await DriveFolder
			.findOne({
				id: ps.parentId,
				userId: user.id
			});

		if (parent === null) {
			throw new ApiError(meta.errors.noSuchFolder);
		}
	}

	// Create folder
	const folder = await DriveFolder.insert({
		createdAt: new Date(),
		name: ps.name,
		parentId: parent !== null ? parent.id : null,
		userId: user.id
	});

	const folderObj = await pack(folder);

	// Publish folderCreated event
	publishDriveStream(user.id, 'folderCreated', folderObj);

	return folderObj;
});
