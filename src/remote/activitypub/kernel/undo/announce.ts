import { Notes } from '../../../../models';
import { IRemoteUser } from '../../../../models/entities/user';
import { IAnnounce, getApId } from '../../type';
import deleteNote from '../../../../services/note/delete';

export const undoAnnounce = async (actor: IRemoteUser, activity: IAnnounce): Promise<void> => {
	const uri = getApId(activity);

	const note = await Notes.findOne({
		uri
	});

	if (!note) return;

	await deleteNote(actor, note);
};
