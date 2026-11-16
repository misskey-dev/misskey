/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

/**
 * admin/update-user-note の maxLength と同じ。
 * AJV 8.20.0 は unicode: false のときだけ String.length を使う。
 * このAPIは指定していないので、サロゲートペア（絵文字など）は1文字。
 */
export const MAX_USER_MODERATION_NOTE_LENGTH = 8192;

export function moderationNoteLength(text: string): number {
	return [...text].length;
}

export function moderationNoteExceedsLimit(text: string): boolean {
	return moderationNoteLength(text) > MAX_USER_MODERATION_NOTE_LENGTH;
}

export function alertModerationNoteTooLong(text: string): Promise<void> {
	return os.alert({
		type: 'error',
		title: i18n.ts.tooLong,
		text: i18n.tsx._dialog.charactersExceeded({
			current: moderationNoteLength(text),
			max: MAX_USER_MODERATION_NOTE_LENGTH,
		}),
	});
}
