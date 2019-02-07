import * as schedule from 'node-schedule';
import NodeinfoStats from '../models/nodeinfo-stats';
import Note from '../models/note';
import User from '../models/user';

export async function fetchStats(date?: Date) {
	const origin = (date || new Date()).getTime();

	const [total, activeHalfyear, activeMonth, localPosts, localComments] = await Promise.all([
		User.count({ host: null }),
		User.count({ host: null, updatedAt: { $gt: new Date(origin - 15552000000) } }),
		User.count({ host: null, updatedAt: { $gt: new Date(origin - 2592000000) } }),
		Note.count({ '_user.host': null, replyId: null }),
		Note.count({ '_user.host': null, replyId: { $ne: null } })
	]);

	return {
		users: { total, activeHalfyear, activeMonth },
		localPosts,
		localComments
	};
}

export default function() {
	const update = async (date?: Date) => {
		const stats = await fetchStats(date);
		await NodeinfoStats.update({}, stats, { upsert: true });
	};

	(NodeinfoStats.count() ? Promise.resolve() : update())
		.then(() => schedule.scheduleJob({ minute: 0 }, update));
}
