declare module 'nested-property' {
	interface IHasNestedPropertyOptions {
		own?: boolean;
	}

	interface IIsInNestedPropertyOptions {
		validPath?: boolean;
	}

	export function set<T>(object: T, property: string, value: any): T;

	export function get(object: object, property: string): any;

	export function has(object: object, property: string, options?: IHasNestedPropertyOptions): boolean;

	export function hasOwn(object: object, property: string, options?: IHasNestedPropertyOptions): boolean;

	export function isIn(object: object, property: string, objectInPath: object, options?: IIsInNestedPropertyOptions): boolean;
}
