import config from '../../../../config';
import { Notes } from '../../../../models';
import { Note } from '../../../../models/entities/note';
import { IRemoteUser } from '../../../../models/entities/user';
import { IAnnounce, getApId } from '../../type';
import deleteNote from '../../../../services/note/delete';

export const undoAnnounce = async (actor: IRemoteUser, activity: IAnnounce): Promise<void> => {
	const targetUri = getApId(activity.object);

	let note: Note | undefined;

	if (targetUri.startsWith(config.url + '/')) {
		// Announce target is local
		const targetNoteId = targetUri.split('/').pop();

		note = await Notes.findOne({
			renoteId: targetNoteId
		});
	} else {
		// Announce target is remote
		const targetNote = await Notes.findOne({
			uri: targetUri
		});

		if (!targetNote) return;

		note = await Notes.findOne({
			renoteId: targetNote.id
		});
	}

	if (!note) return;

	await deleteNote(actor, note);
};
