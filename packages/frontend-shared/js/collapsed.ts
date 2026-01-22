/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';

export function shouldCollapsed(note: Misskey.entities.Note, urls: string[]): boolean {
	if (note.cw != null) {
		return false;
	}

	if (note.text != null) {
		if (
			note.text.includes('$[x2') ||
			note.text.includes('$[x3') ||
			note.text.includes('$[x4') ||
			note.text.includes('$[scale') ||
			note.text.split('\n').length > 9 ||
			note.text.length > 500
		) {
			return true;
		}
	}

	if (urls.length >= 4) {
		return true;
	}

	if (note.files != null && note.files.length >= 5) {
		return true;
	}

	return false;
}
