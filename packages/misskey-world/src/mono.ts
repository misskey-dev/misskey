/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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

export type ImageOptionSchema = {
	type: 'image';
	presets: {
		value: string;
	}[];
};

export type SeedOptionSchema = {
	type: 'seed';
};

export type OptionsSchema = Record<string, NumberOptionSchema | BooleanOptionSchema | StringOptionSchema | ColorOptionSchema | MaterialOptionSchema | LightOptionSchema | EnumOptionSchema | RangeOptionSchema | ImageOptionSchema | SeedOptionSchema>;

export type RawOptions = Record<string, unknown> & {
	readonly __brand: unique symbol;
};

type RawImageValue<Presets extends string = string> = { type: Presets | null | '_custom_'; driveFileId?: string | null; fit?: 'cover' | 'contain' | 'stretch'; rotation?: 0 | 1 | 2 | 3; };
export type GetRawOptionsSchemaValues<T extends OptionsSchema> = {
	[K in keyof T]:
	T[K] extends NumberOptionSchema ? number :
	T[K] extends BooleanOptionSchema ? boolean :
	T[K] extends StringOptionSchema ? string :
	T[K] extends ColorOptionSchema ? [number, number, number] :
	T[K] extends MaterialOptionSchema ? { color: [number, number, number]; metallic: number; roughness: number; } :
	T[K] extends LightOptionSchema ? { color: [number, number, number]; brightness: number; } :
	T[K] extends EnumOptionSchema ? T[K]['enum'][number]['value'] :
	T[K] extends RangeOptionSchema ? number :
	T[K] extends ImageOptionSchema ? RawImageValue<T[K]['presets'][number]['value']> :
	T[K] extends SeedOptionSchema ? number :
	never;
};
