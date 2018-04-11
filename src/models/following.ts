import * as mongo from 'mongodb';
import db from '../db/mongodb';

const Following = db.get<IFollowing>('following');
Following.createIndex(['followerId', 'followeeId'], { unique: true });
export default Following;

export type IFollowing = {
	_id: mongo.ObjectID;
	createdAt: Date;
	followeeId: mongo.ObjectID;
	followerId: mongo.ObjectID;
};
