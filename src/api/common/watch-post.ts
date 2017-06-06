import * as mongodb from 'mongodb';
import Watching from '../models/post-watching';

export default async (me: mongodb.ObjectID, post: object) => {
	// 自分の投稿はwatchできない
	if (me.equals((post as any).user_id)) {
		return;
	}

	// if watching now
	const exist = await Watching.findOne({
		post_id: (post as any)._id,
		user_id: me,
		deleted_at: { $exists: false }
	});

	if (exist !== null) {
		return;
	}

	await Watching.insert({
		created_at: new Date(),
		post_id: (post as any)._id,
		user_id: me
	});
};
