declare module 'ms' {
	interface IMSOptions {
		long: boolean;
	}

	function ms(value: string): number;
	function ms(value: number, options?: IMSOptions): string;

	namespace ms {} // Hack

	export = ms;
}
