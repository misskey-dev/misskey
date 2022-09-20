declare module 'koa-slow' {
	import type { Middleware } from 'koa';

	interface ISlowOptions {
		url?: RegExp;
		delay?: number;
	}

	function slow(options?: ISlowOptions): Middleware;

	namespace slow {} // Hack

	export = slow;
}
