declare module 'deepcopy' {
	type DeepcopyCustomizerValueType = 'Object';

	type DeepcopyCustomizer<T> = (
		value: T,
		valueType: DeepcopyCustomizerValueType) => T;

	interface IDeepcopyOptions<T> {
		customizer: DeepcopyCustomizer<T>;
	}

	function deepcopy<T>(
		value: T,
		options?: IDeepcopyOptions<T> | DeepcopyCustomizer<T>): T;

	namespace deepcopy {} // Hack

	export = deepcopy;
}
