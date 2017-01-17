import db from '../../db/mongodb';

export default db.collection('drive_folders');

export function isValidFolderName(name: string): boolean {
	return (
		(name.trim().length > 0) &&
		(name.length <= 200)
	);
}
