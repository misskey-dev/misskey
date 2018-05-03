import * as mongodb from 'mongodb';
import Watching from '../../models/note-watching';

export default async (me: mongodb.ObjectID, note: object) => {
	// 自分の投稿はwatchできない
	if (me.equals((note as any).userId)) {
		return;
	}

	// if watching now
	const exist = await Watching.findOne({
		noteId: (note as any)._id,
		userId: me,
		deletedAt: { $exists: false }
	});

	if (exist !== null) {
		return;
	}

	await Watching.insert({
		createdAt: new Date(),
		noteId: (note as any)._id,
		userId: me
	});
};
