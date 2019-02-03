declare module 'escape-regexp' {
	function escapeRegExp(str: string): string;

	namespace escapeRegExp {} // Hack

	export = escapeRegExp;
}
