import { Notes } from '@/models/index.js';
import { IRemoteUser } from '@/models/entities/user.js';
import { IAnnounce, getApId } from '../../type.js';
import deleteNote from '@/services/note/delete.js';

export const undoAnnounce = async (actor: IRemoteUser, activity: IAnnounce): Promise<string> => {
	const uri = getApId(activity);

	const note = await Notes.findOne({
		uri,
	});

	if (!note) return 'skip: no such Announce';

	await deleteNote(actor, note);
	return 'ok: deleted';
};
