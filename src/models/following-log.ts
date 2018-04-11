import * as mongo from 'mongodb';
import db from '../db/mongodb';

const FollowingLog = db.get<IFollowingLog>('followingLogs');
export default FollowingLog;

export type IFollowingLog = {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	count: number;
};

/**
 * FollowingLogを物理削除します
 */
export async function deleteFollowingLog(followingLog: string | mongo.ObjectID | IFollowingLog) {
	let f: IFollowingLog;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(followingLog)) {
		f = await FollowingLog.findOne({
			_id: followingLog
		});
	} else if (typeof followingLog === 'string') {
		f = await FollowingLog.findOne({
			_id: new mongo.ObjectID(followingLog)
		});
	} else {
		f = followingLog as IFollowingLog;
	}

	if (f == null) return;

	// このFollowingLogを削除
	await FollowingLog.remove({
		_id: f._id
	});
}
