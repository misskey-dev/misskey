import db from '../../../db/mongodb';

export default db.get('following') as any; // fuck type definition
