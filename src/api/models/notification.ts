import * as mongo from 'mongodb';
import db from '../../db/mongodb';

export default db.get('notifications') as any; // fuck type definition

export interface INotification {
	_id: mongo.ObjectID;
}
