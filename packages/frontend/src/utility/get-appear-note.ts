/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';

export function getAppearNote(note: Misskey.entities.Note) {
	return Misskey.note.isPureRenote(note) ? note.renote : note;
}
