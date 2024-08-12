/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';

export function isRenote(note: Misskey.entities.Note): boolean {
	return (
		note.renote != null &&
		note.reply == null &&
		note.text == null &&
		note.cw == null &&
		(note.fileIds == null || note.fileIds.length === 0) &&
		note.poll == null
	);
}

export function getAppearNote(note: Misskey.entities.Note): Misskey.entities.Note {
	return isRenote(note) ? note.renote! : note;
}
