import db from '../../db/mongodb';

export default db.get('posts') as any; // fuck type definition
