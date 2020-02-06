import config from '../../../config';
import { NoteReaction } from '../../../models/entities/note-reaction';
import { Note } from '../../../models/entities/note';

export const renderLike = (noteReaction: NoteReaction, note: Note) => ({
	type: 'Like',
	id: `${config.url}/likes/${noteReaction.id}`,
	actor: `${config.url}/users/${noteReaction.userId}`,
	object: note.uri ? note.uri : `${config.url}/notes/${noteReaction.noteId}`,
	content: noteReaction.reaction,
	_misskey_reaction: noteReaction.reaction
});
