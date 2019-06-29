export type Schema = {
	type: 'boolean' | 'number' | 'string' | 'array' | 'object' | 'any';
	nullable: boolean;
	optional: boolean;
	items?: Schema;
	properties?: Obj;
	description?: string;
	example?: any;
	format?: string;
	ref?: string;
	enum?: string[];
};

type NonUndefinedPropertyNames<T extends Obj> = {
	[K in keyof T]: T[K]['optional'] extends true ? never : K
}[keyof T];

type UndefinedPropertyNames<T extends Obj> = {
	[K in keyof T]: T[K]['optional'] extends true ? K : never
}[keyof T];

type OnlyRequired<T extends Obj> = Pick<T, NonUndefinedPropertyNames<T>>;
type OnlyOptional<T extends Obj> = Pick<T, UndefinedPropertyNames<T>>;

export type Obj = { [key: string]: Schema };

export type ObjType<s extends Obj> =
	{ [P in keyof OnlyOptional<s>]?: SchemaType<s[P]> } &
	{ [P in keyof OnlyRequired<s>]: SchemaType<s[P]> };

// https://qiita.com/hrsh7th@github/items/84e8968c3601009cdcf2
type MyType<T extends Schema> = {
	0: any;
	1: SchemaType<T>;
}[T extends Schema ? 1 : 0];

type NullOrUndefined<p extends Schema, T> =
	p['nullable'] extends true
		?	p['optional'] extends true
			? (T | null | undefined)
			: (T | null)
		: p['optional'] extends true
			? (T | undefined)
			: T;

export type SchemaType<p extends Schema> =
	p['type'] extends 'number' ? NullOrUndefined<p, number> :
	p['type'] extends 'string' ? NullOrUndefined<p, string> :
	p['type'] extends 'boolean' ? NullOrUndefined<p, boolean> :
	p['type'] extends 'array' ? NullOrUndefined<p, MyType<NonNullable<p['items']>>[]> :
	p['type'] extends 'object' ? NullOrUndefined<p, ObjType<NonNullable<p['properties']>>> :
	p['type'] extends 'any' ? NullOrUndefined<p, any> :
	any;
