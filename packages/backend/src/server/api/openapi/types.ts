export type ValueOf<T> = T[keyof T];

export type Without<T extends object, U extends keyof T> = {
	[K in keyof T]: K extends U ? never : T[K];
};

type FIXME = never;

/**
 * OpenAPIのSpecの型定義
 * @see https://raw.githubusercontent.com/OAI/OpenAPI-Specification/2408885/schemas/v3.0/schema.json
 * @description とりあえずMisskeyにとって必要そうな部分に限って手動で書いたもの。JSON Schemaと対応した完全な型定義が欲しい場合は流石に何かしらのツールを使って自動生成することになるだろう
 */
export type OpenApiSpec = {
	openapi: '3.0.0'; // '3.0.x'や'3.0.x-hoge'は考えないものとする
	info: Info;
	externalDocs?: ExternalDocumentation;
	servers?: Server[];
	security?: SecurityRequirement[];
	tags?: Tag[];
	paths: Paths;
	components?: Components;
} & Extension;

// https://swagger.io/specification/#specification-extensions
type Extension = {
	[ext: `x-${string}`]: unknown;
};

export type Info = {
	title: string;
	description?: string;
	termsOfService?: string;
	contact?: Contact;
	license?: License;
	version: string;
} & Extension;

type Contact = FIXME;

type License = FIXME;

export type ExternalDocumentation = {
	description?: string;
	url: string;
} & Extension;

export type Server = {
	url: string;
	description?: string;
	variables?: {
		[key: string]: ServerVariable;
	};
} & Extension;

type ServerVariable = FIXME;

type SecurityRequirement = {
	[key: string]: string[];
};

type Tag = FIXME;

export type Paths = {
	[path: string]: PathItem; // `path`は/で始まる必要があるものの、それを型で定義すると流石に面倒なのでとりあえず省略
} & Extension;

export type PathItem = {
	$ref?: string;
	summary?: string;
	description?: string;
	servers?: Server[];
	parameters?: (Parameter | Reference)[];
} & Partial<Record<OperationMethod, Operation>> &
	Extension;

type Parameter = FIXME;

type Reference = {
	$ref: string;
};

export type OperationMethod =
	| 'get'
	| 'put'
	| 'post'
	| 'delete'
	| 'options'
	| 'head'
	| 'patch'
	| 'trace';

export type Operation = {
	tags?: string[];
	summary?: string;
	description?: string;
	externalDocs?: ExternalDocumentation;
	operationId?: string;
	parameters?: (Parameter | Reference)[];
	requestBody?: RequestBody | Reference;
	responses: Responses;
	callbacks?: {
		[key: string]: Callback | Reference;
	};
	deprecated?: boolean;
	security?: SecurityRequirement[];
	servers?: Server[];
} & Extension;

type RequestBody = {
	description?: string;
	content: {
		[key: string]: MediaType;
	};
	required?: boolean;
} & Extension;

export type MediaType = (
	| Without<MediaTypeBase, 'example'>
	| Without<MediaTypeBase, 'examples'>
) &
	Extension;

type MediaTypeBase = {
	schema?: Schema | Reference;
	example?: unknown;
	examples?: {
		[key: string]: Example | Reference;
	};
	encoding?: {
		[key: string]: Encoding;
	};
};

type Schema = {
	title?: string;
	multipleOf?: number;
	maximum?: number;
	exclusiveMaximum?: boolean;
	minimum?: number;
	exclusiveMinimum?: boolean;
	maxLength?: number;
	minLength?: number;
	pattern?: string;
	maxItems?: number;
	minItems?: number;
	uniqueItems?: boolean;
	maxProperties?: number;
	minProperties?: number;
	required?: string[];
	enum?: unknown[];
	type?: 'array' | 'boolean' | 'integer' | 'number' | 'object' | 'string';
	not?: Schema | Reference;
	allOf?: (Schema | Reference)[];
	oneOf?: (Schema | Reference)[];
	anyOf?: (Schema | Reference)[];
	items?: Schema | Reference;
	properties?: {
		[key: string]: Schema | Reference;
	};
	additionalProperties?: Schema | Reference | boolean;
	description?: string;
	format?: string;
	default?: unknown;
	nullable?: boolean;
	discriminator?: Discriminator;
	readOnly?: boolean;
	writeOnly?: boolean;
	example?: unknown;
	externalDocs?: ExternalDocumentation;
	deprecated?: boolean;
	xml?: XML;
} & Extension;

type Discriminator = FIXME;

type XML = FIXME;

export type Example = {
	summary?: string;
	description?: string;
	value?: unknown;
	externalValue?: string;
} & Extension;

type Encoding = FIXME;

type Responses = Response | Reference | { [key: string]: Response | Reference };

type Response = {
	description: string;
	headers?: Header | Reference;
	content?: {
		[key: string]: MediaType;
	};
	links?: Link | Reference;
};

type Header = FIXME;

type Link = FIXME;

type Callback = FIXME;

type Components = {
	schemas?: {
		[key: string]: Schema | Reference;
	};
	responses?: {
		[key: string]: Reference | Response;
	};
	parameters?: {
		[key: string]: Reference | Parameter;
	};
	examples?: {
		[key: string]: Reference | Example;
	};
	requestBodies?: {
		[key: string]: Reference | RequestBody;
	};
	headers?: {
		[key: string]: Reference | Header;
	};
	securitySchemes?: {
		[key: string]: Reference | SecurityScheme;
	};
	links?: {
		[key: string]: Reference | Link;
	};
	callbacks?: {
		[key: string]: Reference | Callback;
	};
} & Extension;

type SecurityScheme =
	| APIKeySecurityScheme
	| HTTPSecurityScheme
	| OAuth2SecurityScheme
	| OpenIdConnectSecurityScheme;

type APIKeySecurityScheme = {
	type: 'apiKey';
	name: string;
	in: 'header' | 'query' | 'cookie';
	description?: string;
} & Extension;

type HTTPSecurityScheme = FIXME;

type OAuth2SecurityScheme = FIXME;

type OpenIdConnectSecurityScheme = FIXME;
