import db from '../../../db/mongodb';

const collection = db.get('access_tokens');

(collection as any).createIndex('token'); // fuck type definition
(collection as any).createIndex('hash'); // fuck type definition

export default collection as any; // fuck type definition
