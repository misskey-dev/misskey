/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const easing_easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

export function beginAnimation<const T extends Record<string, number>>(options: {
	from: T;
	to: T;
	duration: number;
	easing?: (t: number) => number;
	apply: (state: T) => void;
	onEnd?: () => void;
}) {
	const easing = options.easing ?? ((t: number) => t);

	const startTime = performance.now();

	function animate(now: number) {
		const elapsed = now - startTime;
		const t = easing(Math.min(elapsed / options.duration, 1));

		const state = {} as T;
		for (const _key in options.from) {
			const key = _key as keyof T;
			state[key] = options.from[key] + (options.to[key] - options.from[key]) * t;
		}
		options.apply(state);

		if (t < 1) {
			window.requestAnimationFrame(animate);
		} else {
			options.onEnd?.();
		}
	}

	window.requestAnimationFrame(animate);
}
