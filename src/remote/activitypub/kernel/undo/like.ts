import { IRemoteUser } from '@/models/entities/user.js';
import { ILike, getApId } from '../../type.js';
import deleteReaction from '@/services/note/reaction/delete.js';
import { fetchNote } from '../../models/note.js';

/**
 * Process Undo.Like activity
 */
export default async (actor: IRemoteUser, activity: ILike) => {
	const targetUri = getApId(activity.object);

	const note = await fetchNote(targetUri);
	if (!note) return `skip: target note not found ${targetUri}`;

	await deleteReaction(actor, note);
	return `ok`;
};
