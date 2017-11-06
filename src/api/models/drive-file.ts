import * as mongodb from 'mongodb';
import monkDb, { nativeDbConn } from '../../db/mongodb';

const collection = monkDb.get('drive_files.files');

(collection as any).createIndex('md5'); // fuck type definition

export default collection as any; // fuck type definition

const getGridFSBucket = async (): Promise<mongodb.GridFSBucket> => {
	const db = await nativeDbConn();
	const bucket = new mongodb.GridFSBucket(db, {
		bucketName: 'drive_files'
	});
	return bucket;
};

export { getGridFSBucket };

export function validateFileName(name: string): boolean {
	return (
		(name.trim().length > 0) &&
		(name.length <= 200) &&
		(name.indexOf('\\') === -1) &&
		(name.indexOf('/') === -1) &&
		(name.indexOf('..') === -1)
	);
}
