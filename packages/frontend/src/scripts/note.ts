/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';

export function isRenote(note: Misskey.entities.Note): boolean {
	return (
		note.renote != null &&
		(note.cw == null && note.text == null) &&
		note.fileIds?.length === 0 &&
		note.poll == null
	);
}

export function getAppearNote(note: Misskey.entities.Note): Misskey.entities.Note {
	return isRenote(note) ? note.renote! : note;
}

type Visibility = (typeof Misskey.noteVisibilities)[number];

export function smallerVisibility(a: Visibility, b: Visibility): Visibility {
	if (a === 'specified' || b === 'specified') return 'specified';
	if (a === 'followers' || b === 'followers') return 'followers';
	if (a === 'home' || b === 'home') return 'home';
	// if (a === 'public' || b === 'public')
	return 'public';
}
