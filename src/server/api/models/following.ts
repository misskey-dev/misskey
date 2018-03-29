import * as mongo from 'mongodb';
import db from '../../../db/mongodb';

const Following = db.get<IFollowing>('following');
export default Following;

export type IFollowing = {
	_id: mongo.ObjectID;
	createdAt: Date;
	deletedAt: Date;
	followeeId: mongo.ObjectID;
	followerId: mongo.ObjectID;
};
