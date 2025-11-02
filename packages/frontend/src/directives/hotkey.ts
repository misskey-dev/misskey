/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { makeHotkey } from '@/utility/hotkey.js';
import type { Keymap } from '@/utility/hotkey.js';

interface HTMLElementWithHotkey extends HTMLElement {
	_hotkey_global?: boolean;
	_keyHandler?: (ev: KeyboardEvent) => void;
}

export const hotkeyDirective = {
	mounted(el, binding) {
		el._hotkey_global = binding.modifiers.global === true;

		el._keyHandler = makeHotkey(binding.value);

		if (el._hotkey_global) {
			window.document.addEventListener('keydown', el._keyHandler, { passive: false });
		} else {
			el.addEventListener('keydown', el._keyHandler, { passive: false });
		}
	},

	unmounted(el) {
		if (el._keyHandler == null) return;
		if (el._hotkey_global) {
			window.document.removeEventListener('keydown', el._keyHandler);
		} else {
			el.removeEventListener('keydown', el._keyHandler);
		}
	},
} as Directive<HTMLElementWithHotkey, Keymap>;
