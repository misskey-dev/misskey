type Obj = { [key: string]: unknown };

declare module 'nested-property' {
	interface IHasNestedPropertyOptions {
		own?: boolean;
	}

	interface IIsInNestedPropertyOptions {
		validPath?: boolean;
	}

	export function set<T>(object: T, property: string, value: unknown): T;

	export function get(object: Obj, property: string): unknown;

	export function has(object: Obj, property: string, options?: IHasNestedPropertyOptions): boolean;

	export function hasOwn(object: Obj, property: string, options?: IHasNestedPropertyOptions): boolean;

	export function isIn(object: Obj, property: string, objectInPath: Obj, options?: IIsInNestedPropertyOptions): boolean;
}
