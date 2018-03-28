import db from '../../../db/mongodb';

export default db.get('channel_watching') as any; // fuck type definition
