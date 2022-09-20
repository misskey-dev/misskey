declare module 'koa-json-body' {
	import type { Middleware } from 'koa';

	interface IKoaJsonBodyOptions {
		strict: boolean;
		limit: string;
		fallback: boolean;
	}

	function koaJsonBody(opt?: IKoaJsonBodyOptions): Middleware;

	namespace koaJsonBody {} // Hack

	export = koaJsonBody;
}
