import { INote } from '../../../models/note';
import { toHtml } from '../../../mfm/toHtml';
import { parse } from '../../../mfm/parse';

export default function(note: INote) {
	let html = toHtml(parse(note.text, true), note.mentionedRemoteUsers);
	if (html == null) html = '<p>.</p>';

	return html;
}
