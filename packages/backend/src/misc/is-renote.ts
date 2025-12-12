/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiNote } from '@/models/Note.js';
import type { Packed } from '@/misc/json-schema.js';

// NoteEntityService.isPureRenote とよしなにリンク

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

type PackedRenote =
	Packed<'Note'> & {
		renoteId: NonNullable<Packed<'Note'>['renoteId']>
	};

type PackedQuote =
	PackedRenote & ({
		text: NonNullable<Packed<'Note'>['text']>
	} | {
		cw: NonNullable<Packed<'Note'>['cw']>
	} | {
		replyId: NonNullable<Packed<'Note'>['replyId']>
	} | {
		poll: NonNullable<Packed<'Note'>['poll']>
	} | {
		fileIds: NonNullable<Packed<'Note'>['fileIds']>
	});

export function isRenotePacked(note: Packed<'Note'>): note is PackedRenote {
	return note.renoteId != null;
}

export function isQuotePacked(note: PackedRenote): note is PackedQuote {
	return note.text != null ||
		note.cw != null ||
		note.replyId != null ||
		note.poll != null ||
		(note.fileIds != null && note.fileIds.length > 0);
}
