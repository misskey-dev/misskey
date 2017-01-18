import db from '../../db/mongodb';

export default db.get('notifications') as any; // fuck type definition
