import Post from '../../../../models/post';
import { createDb } from '../../../../queue';

export default async function(note) {
	const post = await Post.findOneAndDelete({ uri: note.id });

	createDb({
		type: 'deletePostDependents',
		id: post._id
	}).delay(65536).save();
}
