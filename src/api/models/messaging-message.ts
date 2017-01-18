import db from '../../db/mongodb';

export default db.get('messaging_messages') as any; // fuck type definition
