/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type RoomStateObject = {
	id: string;
	type: string;
	position: [number, number, number];
	rotation: [number, number, number];
	options: RawOptions;

	/**
	 * 別のオブジェクトのID
	 */
	sticky?: string | null;
};

export type RoomObjectInstance<Options = any> = {
	onInited?: () => void;
	onOptionsUpdated?: <K extends keyof Options, V extends Options[K]>(kv: [K, V]) => void;
	interactions: Record<string, {
		fn: () => void;
	}>;
	primaryInteraction?: string | null;
	resetTemporaryState?: () => void;
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

type RawImageValue<Presets extends string = string> = { type: Presets | null | '_custom_'; driveFileId?: string | null; fit?: 'cover' | 'contain' | 'stretch'; };
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

export type ObjectSchemaDef<OpSc extends OptionsSchema = OptionsSchema> = {
	id: string;
	options: {
		schema: string extends keyof OpSc ? OptionsSchema : OpSc;
		default: string extends keyof OpSc ? RawOptions : GetRawOptionsSchemaValues<OpSc>; // 関数にした方が使用側でdeepCloneの必要がなくて綺麗かもしれない
	};
	placement: 'top' | 'side' | 'bottom' | 'wall' | 'ceiling' | 'floor';
	hasCollisions?: boolean;
	hasTexture?: boolean;
	canPreMeshesMerging?: boolean; // TODO: 除外するメッシュ名を指定できるようにする
	isChair?: boolean;
};

export function defineObjectSchema<const OpSc extends OptionsSchema>(def: ObjectSchemaDef<OpSc>): ObjectSchemaDef<OpSc> {
	return def;
}
