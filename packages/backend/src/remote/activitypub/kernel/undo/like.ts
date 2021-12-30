import { IRemoteUser } from '@/models/entities/user';
import { ILike, getApId } from '../../type';
import deleteReaction from '@/services/note/reaction/delete';
import { fetchNote } from '../../models/note';

/**
 * Process Undo.Like activity
 */
export default async (actor: IRemoteUser, activity: ILike) => {
	const targetUri = getApId(activity.object);

	const note = await fetchNote(targetUri);
	if (!note) return `skip: target note not found ${targetUri}`;

	await deleteReaction(actor, note).catch(e => {
		if (e.id === '60527ec9-b4cb-4a88-a6bd-32d3ad26817d') return;
		throw e;
	});

	return `ok`;
};
