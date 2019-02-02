declare module 'koa-json-body' {
	import { Middleware } from 'koa';

	interface IKoaJsonBodyOptions {
		strict: boolean;
		limit: string;
		fallback: boolean;
	}

	function koaJsonBody(opt?: IKoaJsonBodyOptions): Middleware;

	namespace koaJsonBody {} // Hack

	export = koaJsonBody;
}
