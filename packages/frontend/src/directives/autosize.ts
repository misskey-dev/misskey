/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { prefer } from '@/preferences.js';

const onInput = (arg: Event | HTMLTextAreaElement) => {
	const el = 'target' in arg ? (arg.target as HTMLTextAreaElement) : arg;
	// 先にautoをしておかないと、縮まってくれない
	el.style.height = 'auto';
	el.style.height = `${el.scrollHeight}px`;
};

export const textareaAutosizeDirective = {
	mounted(el) {
		if (!prefer.s.useTextareaAutoSize) return;
		onInput(el);
		el.addEventListener('input', onInput);
		el.style.resize = 'none';
		el.style.overflow = 'hidden';
	},

	unmounted(el) {
		el.removeEventListener('input', onInput);
	},
} as Directive<HTMLTextAreaElement>;
