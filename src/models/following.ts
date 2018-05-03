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
	stalk: boolean;

	// 非正規化
	_followee: {
		host: string;
		inbox?: string;
	},
	_follower: {
		host: string;
		inbox?: string;
	}
};

/**
 * Followingを物理削除します
 */
export async function deleteFollowing(following: string | mongo.ObjectID | IFollowing) {
	let f: IFollowing;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(following)) {
		f = await Following.findOne({
			_id: following
		});
	} else if (typeof following === 'string') {
		f = await Following.findOne({
			_id: new mongo.ObjectID(following)
		});
	} else {
		f = following as IFollowing;
	}

	if (f == null) return;

	// このFollowingを削除
	await Following.remove({
		_id: f._id
	});
}
