/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { makeHotkey } from '@/utility/hotkey.js';
import type { Keymap } from '@/utility/hotkey.js';

const states = new WeakMap<HTMLElement, {
	isGlobal: boolean;
	keyHandler: (ev: KeyboardEvent) => void;
}>();

export const hotkeyDirective = {
	mounted(el, binding) {
		const isGlobal = (binding.modifiers.global === true);
		const keyHandler = makeHotkey(binding.value);

		if (isGlobal) {
			window.document.addEventListener('keydown', keyHandler, { passive: false });
		} else {
			el.addEventListener('keydown', keyHandler, { passive: false });
		}

		states.set(el, {
			isGlobal,
			keyHandler,
		});
	},

	beforeUnmount(el) {
		const state = states.get(el);
		if (!state) return;

		if (state.isGlobal) {
			window.document.removeEventListener('keydown', state.keyHandler);
		} else {
			el.removeEventListener('keydown', state.keyHandler);
		}

		states.delete(el);
	},
} as Directive<HTMLElement, Keymap>;
