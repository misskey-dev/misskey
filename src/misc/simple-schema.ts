export interface SimpleSchema {
	type: 'boolean' | 'number' | 'string' | 'array' | 'object' | 'any';
	nullable: boolean;
	optional: boolean;
	items?: SimpleSchema;
	properties?: SimpleObj;
	description?: string;
	example?: any;
	format?: string;
	ref?: string;
	enum?: string[];
	default?: boolean | null;
}

export interface SimpleObj { [key: string]: SimpleSchema; }
