import Resolver from '../resolver';
import Post from '../../../models/post';
import { createDb } from '../../../queue';

export default async (actor, activity): Promise<void> => {
	if ('actor' in activity && actor.account.uri !== activity.actor) {
		throw new Error();
	}

	const resolver = new Resolver();

	const object = await resolver.resolve(activity);

	switch (object.type) {
	case 'Note':
		deleteNote(object);
		break;
	}

	async function deleteNote(note) {
		const post = await Post.findOneAndDelete({ uri: note.id });

		createDb({
			type: 'deletePostDependents',
			id: post._id
		}).delay(65536).save();
	}
};
