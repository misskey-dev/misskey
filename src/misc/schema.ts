export const types = {
	boolean: 'boolean' as 'boolean',
	string: 'string' as 'string',
	number: 'number' as 'number',
	array: 'array' as 'array',
	object: 'object' as 'object',
	any: 'any' as 'any',
};

export const bool = {
	true: true as true,
	false: false as false,
};

export type Schema = {
	type: 'boolean' | 'number' | 'string' | 'array' | 'object' | 'any';
	nullable: boolean;
	optional: boolean;
	items?: Schema;
	properties?: Obj;
	description?: string;
	example?: string;
	format?: string;
	ref?: string;
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

export function convertOpenApiSchema(schema: Schema) {
	const x = JSON.parse(JSON.stringify(schema)); // copy
	if (!['string', 'number', 'boolean', 'array', 'object'].includes(x.type)) {
		x['$ref'] = `#/components/schemas/${x.type}`;
	}
	if (x.type === 'array' && x.items) {
		x.items = convertOpenApiSchema(x.items);
	}
	if (x.type === 'object' && x.properties) {
		x.required = Object.entries(x.properties).filter(([k, v]: any) => !v.isOptional).map(([k, v]: any) => k);
		for (const k of Object.keys(x.properties)) {
			x.properties[k] = convertOpenApiSchema(x.properties[k]);
		}
	}
	return x;
}
