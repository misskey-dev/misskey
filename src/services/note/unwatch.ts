import Watching from '../../models/entities/note-watching';

export default async (me: mongodb.ObjectID, note: object) => {
	await Watching.remove({
		noteId: (note as any).id,
		userId: me
	});
};
