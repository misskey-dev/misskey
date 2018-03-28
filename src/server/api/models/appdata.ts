import db from '../../../db/mongodb';

export default db.get('appdata') as any; // fuck type definition
