import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFolder, { isValidFolderName, pack } from '../../../../../models/drive-folder';
import { publishDriveStream } from '../../../../../services/stream';
import define from '../../../define';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': 'ドライブのフォルダを作成します。',
		'en-US': 'Create a folder of drive.'
	},

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
			validator: $.optional.nullable.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '親フォルダID',
				'en-US': 'Parent folder ID'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// If the parent folder is specified
	let parent = null;
	if (ps.parentId) {
		// Fetch parent folder
		parent = await DriveFolder
			.findOne({
				_id: ps.parentId,
				userId: user._id
			});

		if (parent === null) {
			return rej('parent-not-found');
		}
	}

	// Create folder
	const folder = await DriveFolder.insert({
		createdAt: new Date(),
		name: ps.name,
		parentId: parent !== null ? parent._id : null,
		userId: user._id
	});

	// Serialize
	const folderObj = await pack(folder);

	// Response
	res(folderObj);

	// Publish folderCreated event
	publishDriveStream(user._id, 'folderCreated', folderObj);
}));
