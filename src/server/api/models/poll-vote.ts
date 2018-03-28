import db from '../../../db/mongodb';

export default db.get('poll_votes') as any; // fuck type definition
