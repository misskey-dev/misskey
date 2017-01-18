import db from '../../db/mongodb';

export default db.get('drive_folders') as any; // fuck type definition

export function isValidFolderName(name: string): boolean {
	return (
		(name.trim().length > 0) &&
		(name.length <= 200)
	);
}
