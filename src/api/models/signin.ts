import db from '../../db/mongodb';

export default db.get('signin') as any; // fuck type definition
