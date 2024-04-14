/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiNote } from '@/models/Note.js';

type Renote =
	MiNote & {
		renoteId: NonNullable<MiNote['renoteId']>
	};

type Quote =
	Renote & ({
		text: NonNullable<MiNote['text']>
	} | {
		cw: NonNullable<MiNote['cw']>
	} | {
		replyId: NonNullable<MiNote['replyId']>
		reply: NonNullable<MiNote['reply']>
	} | {
		hasPoll: true
	});

export function isRenote(note: MiNote): note is Renote {
	return note.renoteId != null;
}

export function isQuote(note: Renote): note is Quote {
	// NOTE: SYNC WITH NoteCreateService.isQuote
	return note.text != null ||
		note.cw != null ||
		note.replyId != null ||
		note.hasPoll ||
		note.fileIds.length > 0;
}
