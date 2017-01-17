import db from '../../db/mongodb';

const collection = db.get('apps');

(collection as any).index('name_id'); // fuck type definition
(collection as any).index('name_id_lower'); // fuck type definition
(collection as any).index('secret'); // fuck type definition

export default collection;
