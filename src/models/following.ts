import * as mongo from 'mongodb';
import db from '../db/mongodb';

const Following = db.get<IFollowing>('following');
Following.createIndex('followerId');
Following.createIndex('followeeId');
Following.createIndex(['followerId', 'followeeId'], { unique: true });
export default Following;

export type IFollowing = {
	_id: mongo.ObjectID;
	createdAt: Date;
	followeeId: mongo.ObjectID;
	followerId: mongo.ObjectID;

	// 非正規化
	_followee: {
		host: string;
		inbox?: string;
		sharedInbox?: string;
	},
	_follower: {
		host: string;
		inbox?: string;
		sharedInbox?: string;
	}
};
