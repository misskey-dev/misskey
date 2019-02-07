import db from '../db/mongodb';

const NodeinfoStats = db.get<INodeinfoStats>('contributors');
export default NodeinfoStats;

export type INodeinfoStats = {
	users: {
		total: number;
		activeHalfyear: number;
		activeMonth: number;
	};
	localPosts: number;
	localComments: number;
};
