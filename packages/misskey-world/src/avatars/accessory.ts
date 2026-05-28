/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type AvatarAccessoryInstance<Options = any> = {
	onOptionsUpdated?: <K extends keyof Options, V extends Options[K]>(kv: [K, V]) => void;
	dispose: () => void;
};

export type NumberOptionSchema = {
	type: 'number';
	min?: number;
	max?: number;
	step?: number;
};

export type BooleanOptionSchema = {
	type: 'boolean';
};

export type StringOptionSchema = {
	type: 'string';
};

export type ColorOptionSchema = {
	type: 'color';
};

export type MaterialOptionSchema = {
	type: 'material';
};

export type LightOptionSchema = {
	type: 'light';
};

export type EnumOptionSchema = {
	type: 'enum';
	enum: {
		value: string | number;
	}[];
};

export type RangeOptionSchema = {
	type: 'range';
	min: number;
	max: number;
	step?: number;
};

export type AvatarAccessoryOptionsSchema = Record<string, NumberOptionSchema | BooleanOptionSchema | StringOptionSchema | ColorOptionSchema | MaterialOptionSchema | LightOptionSchema | EnumOptionSchema | RangeOptionSchema | ImageOptionSchema | SeedOptionSchema>;

export type GetAvatarAccessoryOptionsSchemaValues<T extends AvatarAccessoryOptionsSchema> = {
	[K in keyof T]:
	T[K] extends NumberOptionSchema ? number :
	T[K] extends BooleanOptionSchema ? boolean :
	T[K] extends StringOptionSchema ? string :
	T[K] extends ColorOptionSchema ? [number, number, number] :
	T[K] extends MaterialOptionSchema ? { color: [number, number, number]; metallic: number; roughness: number; } :
	T[K] extends LightOptionSchema ? { color: [number, number, number]; brightness: number; } :
	T[K] extends EnumOptionSchema ? T[K]['enum'][number]['value'] :
	T[K] extends RangeOptionSchema ? number :
	never;
};

export type AccessorySchemaDef<OpSc extends AvatarAccessoryOptionsSchema = AvatarAccessoryOptionsSchema> = {
	id: string;
	options: {
		schema: string extends keyof OpSc ? AvatarAccessoryOptionsSchema : OpSc;
		default: string extends keyof OpSc ? Record<string, unknown> : GetAvatarAccessoryOptionsSchemaValues<OpSc>; // 関数にした方が使用側でdeepCloneの必要がなくて綺麗かもしれない
	};
};

export function defineAccessorySchema<const OpSc extends AvatarAccessoryOptionsSchema>(def: AccessorySchemaDef<OpSc>): AccessorySchemaDef<OpSc> {
	return def;
}
