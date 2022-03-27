import config from '@/config/index.js';
import { NoteReaction } from '@/models/entities/note-reaction.js';
import { Note } from '@/models/entities/note.js';
import { Emojis } from '@/models/index.js';
import { IsNull } from 'typeorm';
import renderEmoji from './emoji.js';

export const renderLike = async (noteReaction: NoteReaction, note: Note) => {
	const reaction = noteReaction.reaction;

	const object =  {
		type: 'Like',
		id: `${config.url}/likes/${noteReaction.id}`,
		actor: `${config.url}/users/${noteReaction.userId}`,
		object: note.uri ? note.uri : `${config.url}/notes/${noteReaction.noteId}`,
		content: reaction,
		_misskey_reaction: reaction,
	} as any;

	if (reaction.startsWith(':')) {
		const name = reaction.replace(/:/g, '');
		const emoji = await Emojis.findOneBy({
			name,
			host: IsNull(),
		});

		if (emoji) object.tag = [ renderEmoji(emoji) ];
	}

	return object;
};
