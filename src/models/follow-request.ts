import * as mongo from 'mongodb';
import * as deepcopy from 'deepcopy';
import db from '../db/mongodb';
import { pack as packUser } from './user';

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

/**
 * Pack a request for API response
 */
export const pack = (
	request: any,
	me?: any
) => new Promise<any>(async (resolve, reject) => {
	let _request: any;

	// Populate the request if 'request' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(request)) {
		_request = await FollowRequest.findOne({
			_id: request
		});
	} else if (typeof request === 'string') {
		_request = await FollowRequest.findOne({
			_id: new mongo.ObjectID(request)
		});
	} else {
		_request = deepcopy(request);
	}

	// Rename _id to id
	_request.id = _request._id;
	delete _request._id;

	// Populate follower
	_request.follower = await packUser(_request.followerId, me);

	// Populate followee
	_request.followee = await packUser(_request.followeeId, me);

	resolve(_request);
});
