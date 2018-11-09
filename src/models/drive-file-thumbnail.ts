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
