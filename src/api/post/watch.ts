import * as mongodb from 'mongodb';
import Watching from '../models/post-watching';

export default async (me: mongodb.ObjectID, post: object) => {
	// 自分の投稿はwatchできない
	if (me.equals((post as any).userId)) {
		return;
	}

	// if watching now
	const exist = await Watching.findOne({
		postId: (post as any)._id,
		userId: me,
		deletedAt: { $exists: false }
	});

	if (exist !== null) {
		return;
	}

	await Watching.insert({
		createdAt: new Date(),
		postId: (post as any)._id,
		userId: me
	});
};
