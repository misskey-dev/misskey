import db from '../../../db/mongodb';

export default db.get('messaging_histories') as any; // fuck type definition
