import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFolder, { isValidFolderName, pack } from '../../../../../models/drive-folder';
import { publishDriveStream } from '../../../../../stream';
import define from '../../../define';
import { ObjectID } from 'mongodb';
import { error } from '../../../../../prelude/promise';

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
			validator: $.str.optional.pipe(isValidFolderName),
			default: 'Untitled',
			desc: {
				'ja-JP': 'フォルダ名',
				'en-US': 'Folder name'
			}
		},

		parentId: {
			validator: $.type(ID).optional.nullable,
			transform: transform,
			desc: {
				'ja-JP': '親フォルダID',
				'en-US': 'Parent folder ID'
			}
		}
	}
};

const fetchParent = (_id: ObjectID, userId: ObjectID) => _id !== null ? DriveFolder.findOne({ _id, userId })
	.then(x =>
		x === null ? error('parent-not-found') :
		x._id) : Promise.resolve(null);

export default define(meta, (ps, user) => fetchParent(ps.parentId, user._id)
	.then(parentId => DriveFolder.insert({
			createdAt: new Date(),
			name: ps.name,
			parentId,
			userId: user._id
		}))
	.then(pack)
	.then(x => (publishDriveStream(user._id, 'folderCreated', x), x)));
