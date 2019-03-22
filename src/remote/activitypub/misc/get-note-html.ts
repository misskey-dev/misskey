import { Note } from '../../../models/note';
import { toHtml } from '../../../mfm/toHtml';
import { parse } from '../../../mfm/parse';

export default function(note: Note) {
	let html = toHtml(parse(note.text), note.mentionedRemoteUsers);
	if (html == null) html = '<p>.</p>';

	return html;
}
