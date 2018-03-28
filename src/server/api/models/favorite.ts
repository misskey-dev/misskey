import db from '../../../db/mongodb';

export default db.get('favorites') as any; // fuck type definition
