import db from '../../db/mongodb';

const collection = db.get('access_tokens');

(collection as any).index('token'); // fuck type definition
(collection as any).index('hash'); // fuck type definition

export default collection as any; // fuck type definition
