declare module 'querystring' {
	interface IStringifyOptions {
		encodeURIComponent?: (str: string) => string;
	}

	interface IParseOptions {
		maxKeys?: number;
		decodeURIComponent?: (str: string) => string;
	}

	interface IParsedUrlQuery {
		[key: string]: string | string[];
	}

	interface IParsedUrlQueryInput {
		[key: string]: unknown;
	}

	function stringify(obj?: IParsedUrlQueryInput, sep?: string, eq?: string, options?: IStringifyOptions): string;
	function parse(str: string, sep?: string, eq?: string, options?: IParseOptions): IParsedUrlQuery;
	function escape(str: string): string;
	function unescape(str: string): string;
}
