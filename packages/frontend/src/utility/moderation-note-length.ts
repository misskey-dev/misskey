/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

/**
 * admin/update-user-note の maxLength と同じ。
 * 検証は AJV の既定で、UTF-16 の符号単位（String.length）を数える。
 */
export const MAX_USER_MODERATION_NOTE_LENGTH = 8192;

export function moderationNoteExceedsLimit(text: string): boolean {
	return text.length > MAX_USER_MODERATION_NOTE_LENGTH;
}

export function alertModerationNoteTooLong(text: string): Promise<void> {
	return os.alert({
		type: 'error',
		title: i18n.ts.tooLong,
		text: i18n.tsx._dialog.charactersExceeded({
			current: text.length,
			max: MAX_USER_MODERATION_NOTE_LENGTH,
		}),
	});
}
