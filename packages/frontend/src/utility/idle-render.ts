/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const requestIdleCallback: typeof globalThis.requestIdleCallback = globalThis.requestIdleCallback ?? ((callback) => {
	const start = performance.now();
	const timeoutId = setTimeout(() => {
		callback({
			didTimeout: false, // polyfill でタイムアウト発火することはない
			timeRemaining() {
				const diff = performance.now() - start;
				return Math.max(0, 50 - diff); // <https://www.w3.org/TR/requestidlecallback/#idle-periods>
			},
		});
	});
	return timeoutId;
});
const cancelIdleCallback: typeof globalThis.cancelIdleCallback = globalThis.cancelIdleCallback ?? ((timeoutId) => {
	clearTimeout(timeoutId);
});

class IdlingRenderScheduler {
	#renderers: Set<FrameRequestCallback>;
	#rafId: number;
	#ricId: number;

	constructor() {
		this.#renderers = new Set();
		this.#rafId = 0;
		this.#ricId = requestIdleCallback((deadline) => this.#schedule(deadline));
	}

	#schedule(deadline: IdleDeadline): void {
		if (deadline.timeRemaining()) {
			this.#rafId = requestAnimationFrame((time) => {
				for (const renderer of this.#renderers) {
					renderer(time);
				}
			});
		}
		this.#ricId = requestIdleCallback((arg) => this.#schedule(arg));
	}

	add(renderer: FrameRequestCallback): void {
		this.#renderers.add(renderer);
	}

	delete(renderer: FrameRequestCallback): void {
		this.#renderers.delete(renderer);
	}

	dispose(): void {
		this.#renderers.clear();
		cancelAnimationFrame(this.#rafId);
		cancelIdleCallback(this.#ricId);
	}
}

export const defaultIdlingRenderScheduler = new IdlingRenderScheduler();
