import * as mfm from 'mfm-js';
import type { Note } from '@/models/entities/Note.js';
import { toHtml } from '../../../../mfm/to-html.js';

export default function(note: Note) {
	if (!note.text) return '';
	return toHtml(mfm.parse(note.text), JSON.parse(note.mentionedRemoteUsers));
}
