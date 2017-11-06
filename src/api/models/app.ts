import db from '../../db/mongodb';

const collection = db.get('apps');

(collection as any).createIndex('name_id'); // fuck type definition
(collection as any).createIndex('name_id_lower'); // fuck type definition
(collection as any).createIndex('secret'); // fuck type definition

export default collection as any; // fuck type definition

export function isValidNameId(nameId: string): boolean {
	return typeof nameId == 'string' && /^[a-zA-Z0-9\-]{3,30}$/.test(nameId);
}
