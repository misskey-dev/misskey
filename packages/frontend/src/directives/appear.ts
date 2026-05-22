/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { throttle } from 'throttle-debounce';
import type { Directive } from 'vue';
import type { Awaitable } from '@/types/misc.js';

interface HTMLElementWithObserver extends HTMLElement {
	_observer_?: IntersectionObserver;
}

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

		src._observer_ = observer;
	},

	unmounted(src) {
		if (src._observer_) src._observer_.disconnect();
	},
} as Directive<HTMLElementWithObserver, (() => Awaitable<void>) | null | undefined>;
