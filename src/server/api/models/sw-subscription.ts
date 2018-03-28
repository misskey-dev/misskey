import db from '../../../db/mongodb';

export default db.get('sw_subscriptions') as any; // fuck type definition
