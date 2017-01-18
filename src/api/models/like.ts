import db from '../../db/mongodb';

export default db.get('likes') as any; // fuck type definition
