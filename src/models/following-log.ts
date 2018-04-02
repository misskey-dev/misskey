import { ObjectID } from 'mongodb';
import db from '../db/mongodb';

const FollowingLog = db.get<IFollowingLog>('followingLogs');
export default FollowingLog;

export type IFollowingLog = {
	_id: ObjectID;
	createdAt: Date;
	userId: ObjectID;
	count: number;
};
