import * as mongodb from 'mongodb';
import Watching from '../../models/note-watching';

export default async (me: mongodb.ObjectID, note: object) => {
	await Watching.remove({
		noteId: (note as any)._id,
		userId: me
	});
};
