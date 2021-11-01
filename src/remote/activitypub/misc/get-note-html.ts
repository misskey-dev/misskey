import * as mfm from 'mfm-js';
import { fnNameList } from '@/mfm/fn-name-list';
import { Note } from '@/models/entities/note';
import { toHtml } from '../../../mfm/to-html';

export default function(note: Note) {
	let html = note.text ? toHtml(mfm.parse(note.text, { fnNameList }), JSON.parse(note.mentionedRemoteUsers)) : null;
	if (html == null) html = '<p>.</p>';

	return html;
}
