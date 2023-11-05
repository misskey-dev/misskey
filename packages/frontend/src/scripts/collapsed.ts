/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';

export function shouldCollapsed(note: Misskey.entities.Note, urls: string[]): boolean {
	const collapsed = note.cw == null && note.text != null && (
		(note.text.includes('$[x2')) ||
		(note.text.includes('$[x3')) ||
		(note.text.includes('$[x4')) ||
		(note.text.includes('$[scale')) ||
		(note.text.split('\n').length > 9) ||
		(note.text.length > 500) ||
		(note.files.length >= 5) ||
		(urls.length >= 4)
	);

	return collapsed;
}
