import * as mongo from 'mongodb';
import monkDb, { nativeDbConn } from '../db/mongodb';

const DriveFileOriginal = monkDb.get<IDriveFileOriginal>('driveFileOriginals.files');
DriveFileOriginal.createIndex('metadata.originalId', { sparse: true, unique: true });
export default DriveFileOriginal;

export const DriveFileOriginalChunk = monkDb.get('driveFileOriginals.chunks');

export const getDriveFileOriginalBucket = async (): Promise<mongo.GridFSBucket> => {
	const db = await nativeDbConn();
	const bucket = new mongo.GridFSBucket(db, {
		bucketName: 'driveFileOriginals'
	});
	return bucket;
};

export type IMetadata = {
	originalId: mongo.ObjectID;
	accessKey?: string;
};

export type IDriveFileOriginal = {
	_id: mongo.ObjectID;
	uploadDate: Date;
	md5: string;
	filename: string;
	contentType: string;
	metadata: IMetadata;
};
