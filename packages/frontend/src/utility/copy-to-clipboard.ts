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
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (navigator.clipboard) {
			navigator.clipboard.writeText(input);
		} else {
			// Fallback for i2p and tor
			const textarea = window.document.createElement('textarea');
			textarea.value = input;
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			window.document.body.appendChild(textarea);
			textarea.select();
			window.document.execCommand('copy');
			window.document.body.removeChild(textarea);
		}
		os.toast(i18n.ts.copiedToClipboard);
	}
};
