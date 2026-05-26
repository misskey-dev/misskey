/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { BooleanOptionSchema, ColorOptionSchema, EnumOptionSchema, ImageOptionSchema, LightOptionSchema, MaterialOptionSchema, NumberOptionSchema, ObjectSchemaDef, OptionsSchema, RangeOptionSchema, SeedOptionSchema, StringOptionSchema } from 'misskey-world/src/room/object.js';

type GetOptionsSchemaUiDef<T extends OptionsSchema> = {
	[K in keyof T]:
	T[K] extends NumberOptionSchema ? { label: string; } :
	T[K] extends BooleanOptionSchema ? { label: string; } :
	T[K] extends StringOptionSchema ? { label: string; } :
	T[K] extends ColorOptionSchema ? { label: string; } :
	T[K] extends MaterialOptionSchema ? { label: string; } :
	T[K] extends LightOptionSchema ? { label: string; } :
	T[K] extends EnumOptionSchema ? { label: string; enum: Record<T[K]['enum'][number]['value'], { label: string; }>; } :
	T[K] extends RangeOptionSchema ? { label: string; } :
	T[K] extends ImageOptionSchema ? { label: string; presets: Record<T[K]['presets'][number]['value'], { label: string; }>; } :
	T[K] extends SeedOptionSchema ? { label: string; } :
	never;
};

export type ObjectUiDef<Schema extends ObjectSchemaDef = ObjectSchemaDef> = {
	name: string;
	options: GetOptionsSchemaUiDef<Schema['options']['schema']>;
};

export function defineObjectUi<const Schema extends ObjectSchemaDef<any>>(def: ObjectUiDef<Schema>): ObjectUiDef<Schema> {
	return def;
}
