/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { makeHotkey } from '@/utility/hotkey.js';
import type { Keymap } from '@/utility/hotkey.js';

const abortControllers = new WeakMap<HTMLElement, AbortController>();

type GlobalHotkey = {
	el: HTMLElement;
	keyHandler: (ev: KeyboardEvent) => boolean;
};

// v-hotkey.global の登録順に並べる（後ろほど後から登録されたもの）
const globalHotkeys: GlobalHotkey[] = [];

// 非表示の要素や、閉じている途中で操作を受け付けない要素（pointer-events: none）はキー入力も受け取らない
function isActive(el: HTMLElement) {
	if (el.getClientRects().length === 0) return false;
	return window.getComputedStyle(el).pointerEvents !== 'none';
}

// モーダルなどが重なっているとき、同じキーが下のものにまで届かないよう、
// 後から登録されたものから順に処理し、最初に処理したものより前のものには渡さない
function onGlobalKeydown(ev: KeyboardEvent) {
	for (let i = globalHotkeys.length - 1; i >= 0; i--) {
		const { el, keyHandler } = globalHotkeys[i];
		if (!isActive(el)) continue;
		if (keyHandler(ev)) return;
	}
}

export const hotkeyDirective = {
	mounted(el, binding) {
		const isGlobal = (binding.modifiers.global === true);
		const keyHandler = makeHotkey(binding.value);

		if (isGlobal) {
			if (globalHotkeys.length === 0) {
				window.document.addEventListener('keydown', onGlobalKeydown, { passive: false });
			}
			globalHotkeys.push({ el, keyHandler });
			return;
		}

		const abortController = new AbortController();
		el.addEventListener('keydown', keyHandler, { passive: false, signal: abortController.signal });
		abortControllers.set(el, abortController);
	},

	beforeUnmount(el) {
		const index = globalHotkeys.findIndex(x => x.el === el);
		if (index !== -1) {
			globalHotkeys.splice(index, 1);
			if (globalHotkeys.length === 0) {
				window.document.removeEventListener('keydown', onGlobalKeydown);
			}
			return;
		}

		const abortController = abortControllers.get(el);
		if (abortController) {
			abortController.abort();
			abortControllers.delete(el);
		}
	},
} as Directive<HTMLElement, Keymap>;
