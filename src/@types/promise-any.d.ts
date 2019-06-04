declare module 'promise-unknown' {
	function promiseAny<T>(iterable: Iterable<T | PromiseLike<T>>): Promise<T>;

	namespace promiseAny {} // Hack

	export = promiseAny;
}
