import * as mongo from 'mongodb';
import * as deepcopy from 'deepcopy';
import { pack as packFolder } from './drive-folder';
import config from '../config';
import monkDb, { nativeDbConn } from '../db/mongodb';
import Note, { deleteNote } from './note';
import MessagingMessage, { deleteMessagingMessage } from './messaging-message';
import User from './user';
import DriveFileThumbnail, { deleteDriveFileThumbnail } from './drive-file-thumbnail';

const DriveFile = monkDb.get<IDriveFile>('driveFiles.files');
DriveFile.createIndex('md5', { sparse: true });
DriveFile.createIndex('metadata.uri', { sparse: true, unique: true });
export default DriveFile;

export const DriveFileChunk = monkDb.get('driveFiles.chunks');

export const getDriveFileBucket = async (): Promise<mongo.GridFSBucket> => {
	const db = await nativeDbConn();
	const bucket = new mongo.GridFSBucket(db, {
		bucketName: 'driveFiles'
	});
	return bucket;
};

export type IMetadata = {
	properties: any;
	userId: mongo.ObjectID;
	_user: any;
	folderId: mongo.ObjectID;
	comment: string;
	uri?: string;
	url?: string;
	deletedAt?: Date;
	isMetaOnly?: boolean;
};

export type IDriveFile = {
	_id: mongo.ObjectID;
	uploadDate: Date;
	md5: string;
	filename: string;
	contentType: string;
	metadata: IMetadata;
};

export function validateFileName(name: string): boolean {
	return (
		(name.trim().length > 0) &&
		(name.length <= 200) &&
		(name.indexOf('\\') === -1) &&
		(name.indexOf('/') === -1) &&
		(name.indexOf('..') === -1)
	);
}

/**
 * DriveFileを物理削除します
 */
export async function deleteDriveFile(driveFile: string | mongo.ObjectID | IDriveFile) {
	let d: IDriveFile;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(driveFile)) {
		d = await DriveFile.findOne({
			_id: driveFile
		});
	} else if (typeof driveFile === 'string') {
		d = await DriveFile.findOne({
			_id: new mongo.ObjectID(driveFile)
		});
	} else {
		d = driveFile as IDriveFile;
	}

	if (d == null) return;

	// このDriveFileを添付しているNoteをすべて削除
	await Promise.all((
		await Note.find({ mediaIds: d._id })
	).map(x => deleteNote(x)));

	// このDriveFileを添付しているMessagingMessageをすべて削除
	await Promise.all((
		await MessagingMessage.find({ fileId: d._id })
	).map(x => deleteMessagingMessage(x)));

	// このDriveFileがアバターやバナーに使われていたらそれらのプロパティをnullにする
	const u = await User.findOne({ _id: d.metadata.userId });
	if (u) {
		if (u.avatarId && u.avatarId.equals(d._id)) {
			await User.update({ _id: u._id }, { $set: { avatarId: null } });
		}
		if (u.bannerId && u.bannerId.equals(d._id)) {
			await User.update({ _id: u._id }, { $set: { bannerId: null } });
		}
	}

	// このDriveFileのDriveFileThumbnailをすべて削除
	await Promise.all((
		await DriveFileThumbnail.find({ 'metadata.originalId': d._id })
	).map(x => deleteDriveFileThumbnail(x)));

	// このDriveFileのチャンクをすべて削除
	await DriveFileChunk.remove({
		files_id: d._id
	});

	// このDriveFileを削除
	await DriveFile.remove({
		_id: d._id
	});
}

/**
 * Pack a drive file for API response
 */
export const pack = (
	file: any,
	options?: {
		detail: boolean
	}
) => new Promise<any>(async (resolve, reject) => {
	const opts = Object.assign({
		detail: false
	}, options);

	let _file: any;

	// Populate the file if 'file' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(file)) {
		_file = await DriveFile.findOne({
			_id: file
		});
	} else if (typeof file === 'string') {
		_file = await DriveFile.findOne({
			_id: new mongo.ObjectID(file)
		});
	} else {
		_file = deepcopy(file);
	}

	if (!_file) return reject('invalid file arg.');

	// rendered target
	let _target: any = {};

	_target.id = _file._id;
	_target.createdAt = _file.uploadDate;
	_target.name = _file.filename;
	_target.type = _file.contentType;
	_target.datasize = _file.length;
	_target.md5 = _file.md5;

	_target = Object.assign(_target, _file.metadata);

	_target.src = _file.metadata.url;
	_target.url = _file.metadata.isMetaOnly ? _file.metadata.url : `${config.drive_url}/${_target.id}/${encodeURIComponent(_target.name)}`;
	_target.isRemote = _file.metadata.isMetaOnly;

	if (_target.properties == null) _target.properties = {};

	if (opts.detail) {
		if (_target.folderId) {
			// Populate folder
			_target.folder = await packFolder(_target.folderId, {
				detail: true
			});
		}

		/*
		if (_target.tags) {
			// Populate tags
			_target.tags = await _target.tags.map(async (tag: any) =>
				await serializeDriveTag(tag)
			);
		}
		*/
	}

	resolve(_target);
});
