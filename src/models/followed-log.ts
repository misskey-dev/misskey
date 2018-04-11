import { ObjectID } from 'mongodb';
import db from '../db/mongodb';

const FollowedLog = db.get<IFollowedLog>('followedLogs');
export default FollowedLog;

export type IFollowedLog = {
	_id: ObjectID;
	createdAt: Date;
	userId: ObjectID;
	count: number;
};
