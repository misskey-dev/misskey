import { IRemoteUser } from '../../../../models/entities/user';
import { ILike } from '../../type';
import Note from '../../../../models/entities/note';
import deleteReaction from '../../../../services/note/reaction/delete';

/**
 * Process Undo.Like activity
 */
export default async (actor: IRemoteUser, activity: ILike): Promise<void> => {
	const id = typeof activity.object == 'string' ? activity.object : activity.object.id;

	const noteId = id.split('/').pop();

	const note = await Note.findOne({ _id: noteId });
	if (note === null) {
		throw 'note not found';
	}

	await deleteReaction(actor, note);
};
