import db from '../../../db/mongodb';

export default db.get('drive_tags') as any; // fuck type definition
