import db from '../../db/mongodb';

export default db.get('post_reactions') as any; // fuck type definition
