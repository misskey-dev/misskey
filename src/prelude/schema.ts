export type Schema = {
	type: 'number' | 'string' | 'array' | 'object' | any;
	optional?: boolean;
	items?: Schema;
	properties?: Obj;
	description?: string;
};

export type Obj = { [key: string]: Schema };

export type ObjType<s extends Obj> = { [P in keyof s]: SchemaType<s[P]> };

// https://qiita.com/hrsh7th@github/items/84e8968c3601009cdcf2
type MyType<T extends Schema> = {
	0: any;
	1: SchemaType<T>;
}[T extends Schema ? 1 : 0];

export type SchemaType<p extends Schema> =
	p['type'] extends 'number' ? number :
	p['type'] extends 'string' ? string :
	p['type'] extends 'array' ? MyType<p['items']>[] :
	p['type'] extends 'object' ? ObjType<p['properties']> :
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
