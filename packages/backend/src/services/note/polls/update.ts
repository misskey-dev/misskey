import renderUpdate from '@/remote/activitypub/renderer/update.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderNote from '@/remote/activitypub/renderer/note.js';
import { Users, Notes } from '@/models/index.js';
import { Note } from '@/models/entities/note.js';
import { deliverToFollowers } from '@/remote/activitypub/deliver-manager.js';
import { deliverToRelays } from '../../relay.js';

export async function deliverQuestionUpdate(noteId: Note['id']) {
	const note = await Notes.findOneBy({ id: noteId });
	if (note == null) throw new Error('note not found');

	const user = await Users.findOneBy({ id: note.userId });
	if (user == null) throw new Error('note not found');

	if (Users.isLocalUser(user)) {

		const content = renderActivity(renderUpdate(await renderNote(note, false), user));
		deliverToFollowers(user, content);
		deliverToRelays(user, content);
	}
}
