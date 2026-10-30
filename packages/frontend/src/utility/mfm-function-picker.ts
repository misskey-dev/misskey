/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MFM_TAGS } from '@@/js/const.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

/**
 * MFMの装飾のリストを表示する
 */
export function mfmFunctionPicker(anchorElement: HTMLElement | EventTarget | null, onChosen: (tag: string) => void, onClosed?: () => void) {
	os.popupMenu([{
		text: i18n.ts.addMfmFunction,
		type: 'label',
	}, ...MFM_TAGS.map(tag => ({
		text: tag,
		icon: 'ti ti-icons',
		action: () => {
			onChosen(tag);
		},
	}))], anchorElement, {
		onClosed: () => {
			if (onClosed) onClosed();
		},
	});
}

