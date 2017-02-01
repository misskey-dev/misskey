import db from '../../db/mongodb';

const collection = db.get('drive_files');

(collection as any).index('hash'); // fuck type definition

export default collection as any; // fuck type definition

export function validateFileName(name: string): boolean {
	return (
		(name.trim().length > 0) &&
		(name.length <= 200) &&
		(name.indexOf('\\') === -1) &&
		(name.indexOf('/') === -1) &&
		(name.indexOf('..') === -1)
	);
}
