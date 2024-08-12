/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';

type NonNullableRecord<T> = {
	[P in keyof T]-?: NonNullable<T[P]>;
};
type AllNullRecord<T> = {
	[P in keyof T]: null;
};
type Renote =
	Omit<Misskey.entities.Note, 'renote' | 'renoteId' | 'reply' | 'replyId' | 'text' | 'cw' | 'files' | 'fileIds' | 'poll'>
	& AllNullRecord<Pick<Misskey.entities.Note, 'reply' | 'replyId' | 'text' | 'cw' | 'poll'>>
	& { files: []; fileIds: []; }
	& NonNullableRecord<Pick<Misskey.entities.Note, 'renote' | 'renoteId'>>;

// TODO: misskey-jsに移す

export function isRenote(note: Misskey.entities.Note): note is Renote {
	return (
		note.renote != null &&
		note.reply == null &&
		note.text == null &&
		note.cw == null &&
		(note.fileIds == null || note.fileIds.length === 0) &&
		note.poll == null
	);
}

export function getAppearNote(note: Misskey.entities.Note) {
	return isRenote(note) ? note.renote : note;
}
