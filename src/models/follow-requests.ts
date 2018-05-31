import * as mongo from 'mongodb';
import db from '../db/mongodb';

const FollowRequest = db.get<IFollowRequest>('followRequests');
FollowRequest.createIndex(['followerId', 'followeeId'], { unique: true });
export default FollowRequest;

export type IFollowRequest = {
	_id: mongo.ObjectID;
	createdAt: Date;
	followeeId: mongo.ObjectID;
	followerId: mongo.ObjectID;

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
 * FollowRequestを物理削除します
 */
export async function deleteFollowRequest(followRequest: string | mongo.ObjectID | IFollowRequest) {
	let f: IFollowRequest;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(followRequest)) {
		f = await FollowRequest.findOne({
			_id: followRequest
		});
	} else if (typeof followRequest === 'string') {
		f = await FollowRequest.findOne({
			_id: new mongo.ObjectID(followRequest)
		});
	} else {
		f = followRequest as IFollowRequest;
	}

	if (f == null) return;

	// このFollowingを削除
	await FollowRequest.remove({
		_id: f._id
	});
}
