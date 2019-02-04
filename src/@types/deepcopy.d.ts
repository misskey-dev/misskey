declare module 'deepcopy';

declare namespace deepcopy {
	type DeepcopyCustomizerValueType = 'Object';

	type DeepcopyCustomizer<T> = (
		value: T,
		valueType: DeepcopyCustomizerValueType) => T;

	interface DeepcopyOptions<T> {
		customizer: DeepcopyCustomizer<T>;
	}

	export function deepcopy<T>(
		value: T,
		options?: DeepcopyOptions<T> | DeepcopyCustomizer<T>): T;
}
