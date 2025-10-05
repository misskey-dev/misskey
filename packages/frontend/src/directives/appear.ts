/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { throttle } from 'throttle-debounce';
import type { Directive } from 'vue';

export default {
	mounted(src, binding, vn) {
		const fn = binding.value;
		if (fn == null) return;

		const check = throttle(1000, (entries) => {
			if (entries.some(entry => entry.isIntersecting)) {
				fn();
			}
		});

		const observer = new IntersectionObserver(check);

		observer.observe(src);

		src._observer_ = observer;
	},

	unmounted(src, binding, vn) {
		if (src._observer_) src._observer_.disconnect();
	},
} as Directive;
