declare module 'koa-slow' {
	import { Middleware } from 'koa';

	interface ISlowOptions {
		url?: RegExp;
		delay?: number;
	}

	function slow(options?: ISlowOptions): Middleware;

	namespace slow {} // Hack

	export = slow;
}
