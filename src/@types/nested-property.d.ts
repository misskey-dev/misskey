type Obj = { [key: string]: any };

declare module 'nested-property' {
	interface IHasNestedPropertyOptions {
		own?: boolean;
	}

	interface IIsInNestedPropertyOptions {
		validPath?: boolean;
	}

	export function set<T>(object: T, property: string, value: any): T;

	export function get(object: Obj, property: string): any;

	export function has(object: Obj, property: string, options?: IHasNestedPropertyOptions): boolean;

	export function hasOwn(object: Obj, property: string, options?: IHasNestedPropertyOptions): boolean;

	export function isIn(object: Obj, property: string, objectInPath: Obj, options?: IIsInNestedPropertyOptions): boolean;
}
