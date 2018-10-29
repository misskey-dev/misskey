import * as mongo from 'mongodb';
import db from '../db/mongodb';

const Mute = db.get<IMute>('mute');
Mute.createIndex(['muterId', 'muteeId'], { unique: true });
export default Mute;

export interface IMute {
	_id: mongo.ObjectID;
	createdAt: Date;
	muterId: mongo.ObjectID;
	muteeId: mongo.ObjectID;
}
