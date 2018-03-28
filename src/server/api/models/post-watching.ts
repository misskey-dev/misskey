import db from '../../../db/mongodb';

export default db.get('post_watching') as any; // fuck type definition
