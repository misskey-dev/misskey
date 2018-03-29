import * as mongo from 'mongodb';
import db from '../db/mongodb';

const Mute = db.get<IMute>('mute');
export default Mute;

export interface IMute {
	_id: mongo.ObjectID;
	createdAt: Date;
	deletedAt: Date;
	muterId: mongo.ObjectID;
	muteeId: mongo.ObjectID;
}
