import { ObjectID } from 'mongodb';
import db from '../db/mongodb';

const FollowingLog = db.get<IFollowingLog>('followingLogs');
export default FollowingLog;

export type IFollowingLog = {
	_id: ObjectID;
	userId: ObjectID;
	count: number;
};
