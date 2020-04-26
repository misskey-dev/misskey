import { Note } from '../../../models/entities/note';
import { toHtml } from '../../../mfm/to-html';
import { parse } from '../../../mfm/parse';

export default function(note: Note) {
	let html = toHtml(parse(note.text), JSON.parse(note.mentionedRemoteUsers));
	if (html == null) html = '<p>.</p>';

	return html;
}
