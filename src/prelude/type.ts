// tslint:disable: no-any
export type AsyncReturnType<T extends (...args: any[]) => any> =
	T extends (...args: any[]) => Promise<infer R> ? R :
	T extends (...args: any[]) => PromiseLike<infer R> ? R : ReturnType<T>;
// tslint:enable: no-any
