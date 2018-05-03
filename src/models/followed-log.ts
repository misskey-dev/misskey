import * as mongo from 'mongodb';
import db from '../db/mongodb';

const FollowedLog = db.get<IFollowedLog>('followedLogs');
export default FollowedLog;

export type IFollowedLog = {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	count: number;
};

/**
 * FollowedLogを物理削除します
 */
export async function deleteFollowedLog(followedLog: string | mongo.ObjectID | IFollowedLog) {
	let f: IFollowedLog;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(followedLog)) {
		f = await FollowedLog.findOne({
			_id: followedLog
		});
	} else if (typeof followedLog === 'string') {
		f = await FollowedLog.findOne({
			_id: new mongo.ObjectID(followedLog)
		});
	} else {
		f = followedLog as IFollowedLog;
	}

	if (f == null) return;

	// このFollowedLogを削除
	await FollowedLog.remove({
		_id: f._id
	});
}
