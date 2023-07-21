import * as mfm from 'mfm-js';
import * as misskey from 'misskey-js';
import { extractUrlFromMfm } from './extract-url-from-mfm';

const scaleRegex = /\$\[scale\.(([xy]=[2345](\.\d)*){1}|([xy]=[12345](\.\d)*){1}(,[xy]=[2345](\.\d)*){1})/;

export function shouldCollapsed(note: misskey.entities.Note): boolean {
	const urls = note.text ? extractUrlFromMfm(mfm.parse(note.text)) : null;
	const collapsed = note.cw == null && note.text != null && (
		(note.text.includes('$[x3')) ||
		(note.text.includes('$[x4')) ||
		(scaleRegex.test(note.text)) ||
		(note.text.split('\n').length > 9) ||
		(note.text.length > 500) ||
		(note.files.length >= 5) ||
		(!!urls && urls.length >= 4)
	);

	return collapsed;
}
