import db from '../../db/mongodb';

export default db.get('auth_sessions') as any; // fuck type definition
