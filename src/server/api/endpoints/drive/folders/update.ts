import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFolder, { isValidFolderName, pack } from '../../../../../models/drive-folder';
import { publishDriveStream } from '../../../../../stream';
import define from '../../../define';
import { ObjectID } from 'mongodb';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのフォルダの情報を更新します。',
		'en-US': 'Update specified folder of drive.'
	},

	requireCredential: true,

	kind: 'drive-write',

	params: {
		folderId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のフォルダID',
				'en-US': 'Target folder ID'
			}
		},

		name: {
			validator: $.str.optional.pipe(isValidFolderName),
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

const ensureCircular = async (_id: ObjectID, baseId: ObjectID) => {
	const folder = await DriveFolder.findOne({ _id }, {
		_id: true,
		parentId: true
	});
	if (folder._id.equals(baseId)) throw 'detected-circular-definition';
	if (folder.parentId) await ensureCircular(folder.parentId, baseId);
};

const fetchParent = async (_id: ObjectID, userId: ObjectID, baseId: ObjectID) => {
	const parent = await DriveFolder.findOne({ _id, userId });
	if (parent === null) throw 'parent-folder-not-found';
	if (parent.parentId) await ensureCircular(parent.parentId, baseId);
	return parent._id;
};

export default define(meta, (ps, user) => DriveFolder.findOne({
		_id: ps.folderId,
		userId: user._id
	})
	.then(async x => {
		if (x === null) throw 'folder-not-found';
		if (ps.name) x.name = ps.name;
		if (ps.parentId !== undefined) x.parentId = ps.parentId === null ? null : await fetchParent(ps.parentId, user._id, x._id);
		DriveFolder.update(x._id, {
			$set: {
				name: x.name,
				parentId: x.parentId
			}
		});
		const result = await pack(x);
		publishDriveStream(user._id, 'folderUpdated', result);
		return result;
	}));
