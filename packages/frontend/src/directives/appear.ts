/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { throttle } from 'throttle-debounce';
import type { Directive } from 'vue';
import type { Awaitable } from '@/types/misc.js';

const observers = new WeakMap<HTMLElement, IntersectionObserver>();

export const appearDirective = {
	mounted(src, binding) {
		const fn = binding.value;
		if (fn == null) return;

		const check = throttle<IntersectionObserverCallback>(500, (entries) => {
			if (entries.some(entry => entry.isIntersecting)) {
				fn();
			}
		});

		const observer = new IntersectionObserver(check);
		observer.observe(src);

		observers.set(src, observer);
	},

	beforeUnmount(src) {
		const observer = observers.get(src);
		if (observer) {
			observer.disconnect();
			observers.delete(src);
		}
	},
} as Directive<HTMLElement, (() => Awaitable<void>) | null | undefined>;
