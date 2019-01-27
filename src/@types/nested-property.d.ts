declare module 'nested-property' {
	interface HasNestedPropertyOptions {
		own?: boolean
	}

	interface IsInNestedPropertyOptions {
		validPath?: boolean
	}

	export function set<T>(object: T, property: string, value: any): T;

	export function get(object: object, property: string): any;

	export function has(object: object, property: string, options?: HasNestedPropertyOptions): boolean;

	export function hasOwn(object: object, property: string, options?: HasNestedPropertyOptions): boolean;

	export function isIn(object: object, property: string, objectInPath: object, options?: IsInNestedPropertyOptions): boolean;
}
