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
