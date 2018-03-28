import db from '../../../db/mongodb';

export default db.get('mute') as any; // fuck type definition
