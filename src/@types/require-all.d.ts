declare module 'require-all' {
	type RequireAllFilterFunction = (filename: string) => string | void;
	type RequireAllFilter =  RequireAllFilterFunction | RegExp;

	type RequireAllResolve<T, U> = (resolved: U) => T;

	type RequireAllMap = (name: string, filepath: string) => string;

	interface IRequireAllOptions<T, U> {
		dirname: string;
		excludeDirs: RegExp;
		filter: RequireAllFilter;
		recursive: boolean;
		resolve: RequireAllResolve<T, U>;
		map: RequireAllMap;
	}

	function requireAll<T, U = unknown>(options: Partial<IRequireAllOptions<T, U>>): Record<string, T>;

	namespace requireAll {} // Hack

	export = requireAll;
}
