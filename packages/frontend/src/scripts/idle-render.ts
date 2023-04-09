// eslint-disable-next-line import/no-default-export
export default class IdlingRenderScheduler {
	#renderers: Set<FrameRequestCallback>;
	#budget: number;
	#rafId: number;
	#ricId: number;

	constructor(budget = 0) {
		this.#renderers = new Set();
		this.#budget = budget;
		this.#rafId = 0;
		this.#ricId = requestIdleCallback((deadline) => this.#render(deadline));
	}

	#render(deadline: IdleDeadline): void {
		if (deadline.timeRemaining() > this.#budget) {
			this.#rafId = requestAnimationFrame((time) => {
				for (const renderer of this.#renderers) {
					renderer(time);
				}
			});
		}
		this.#ricId = requestIdleCallback((arg) => this.#render(arg));
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
