import renderUpdate from '../../../remote/activitypub/renderer/update';
import { renderActivity } from '../../../remote/activitypub/renderer';
import renderNote from '../../../remote/activitypub/renderer/note';
import { Users, Notes } from '../../../models';
import { Note } from '../../../models/entities/note';
import { deliverToFollowers } from '../../../remote/activitypub/deliver-manager';
import { deliverToRelays } from '../../relay';

export async function deliverQuestionUpdate(noteId: Note['id']) {
	const note = await Notes.findOne(noteId);
	if (note == null) throw new Error('note not found');

	const user = await Users.findOne(note.userId);
	if (user == null) throw new Error('note not found');

	if (Users.isLocalUser(user)) {

		const content = renderActivity(renderUpdate(await renderNote(note, false), user));
		deliverToFollowers(user, content);
		deliverToRelays(user, content);
	}
}
