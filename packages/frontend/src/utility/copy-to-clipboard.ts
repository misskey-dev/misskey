/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

/**
 * Clipboardに値をコピー(TODO: 文字列以外も対応)
 */
export function copyToClipboard(input: string | null) {
	if (input) {
		navigator.clipboard.writeText(input);
		os.toast(i18n.ts.copiedToClipboard);
	}
};
