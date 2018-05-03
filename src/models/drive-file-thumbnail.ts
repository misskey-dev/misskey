import * as mongo from 'mongodb';
import monkDb, { nativeDbConn } from '../db/mongodb';

const DriveFileThumbnail = monkDb.get<IDriveFileThumbnail>('driveFileThumbnails.files');
DriveFileThumbnail.createIndex('metadata.originalId', { sparse: true, unique: true });
export default DriveFileThumbnail;

export const DriveFileThumbnailChunk = monkDb.get('driveFileThumbnails.chunks');

export const getDriveFileThumbnailBucket = async (): Promise<mongo.GridFSBucket> => {
	const db = await nativeDbConn();
	const bucket = new mongo.GridFSBucket(db, {
		bucketName: 'driveFileThumbnails'
	});
	return bucket;
};

export type IMetadata = {
	originalId: mongo.ObjectID;
};

export type IDriveFileThumbnail = {
	_id: mongo.ObjectID;
	uploadDate: Date;
	md5: string;
	filename: string;
	contentType: string;
	metadata: IMetadata;
};

/**
 * DriveFileThumbnailを物理削除します
 */
export async function deleteDriveFileThumbnail(driveFile: string | mongo.ObjectID | IDriveFileThumbnail) {
	let d: IDriveFileThumbnail;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(driveFile)) {
		d = await DriveFileThumbnail.findOne({
			_id: driveFile
		});
	} else if (typeof driveFile === 'string') {
		d = await DriveFileThumbnail.findOne({
			_id: new mongo.ObjectID(driveFile)
		});
	} else {
		d = driveFile as IDriveFileThumbnail;
	}

	if (d == null) return;

	// このDriveFileThumbnailのチャンクをすべて削除
	await DriveFileThumbnailChunk.remove({
		files_id: d._id
	});

	// このDriveFileThumbnailを削除
	await DriveFileThumbnail.remove({
		_id: d._id
	});
}
