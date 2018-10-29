import * as mongo from 'mongodb';
import db from '../db/mongodb';

const Blocking = db.get<IBlocking>('blocking');
Blocking.createIndex(['blockerId', 'blockeeId'], { unique: true });
export default Blocking;

export type IBlocking = {
	_id: mongo.ObjectID;
	createdAt: Date;
	blockeeId: mongo.ObjectID;
	blockerId: mongo.ObjectID;
};
