declare module 'is-url' {
	function isUrl(string: string): boolean;

	namespace isUrl {} // Hack

	export = isUrl;
}
