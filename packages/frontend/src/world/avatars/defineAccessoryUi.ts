/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { AccessorySchemaDef, AvatarAccessoryOptionsSchema, BooleanOptionSchema, ColorOptionSchema, EnumOptionSchema, LightOptionSchema, MaterialOptionSchema, NumberOptionSchema, RangeOptionSchema, StringOptionSchema } from 'misskey-world/src/avatars/accessory.js';

type GetOptionsSchemaUiDef<T extends AvatarAccessoryOptionsSchema> = {
	[K in keyof T]:
	T[K] extends NumberOptionSchema ? { label: string; } :
	T[K] extends BooleanOptionSchema ? { label: string; } :
	T[K] extends StringOptionSchema ? { label: string; } :
	T[K] extends ColorOptionSchema ? { label: string; } :
	T[K] extends MaterialOptionSchema ? { label: string; } :
	T[K] extends LightOptionSchema ? { label: string; } :
	T[K] extends EnumOptionSchema ? { label: string; enum: Record<T[K]['enum'][number]['value'], { label: string; }>; } :
	T[K] extends RangeOptionSchema ? { label: string; } :
	never;
};

export type AccessoryUiDef<Schema extends AccessorySchemaDef = AccessorySchemaDef> = {
	name: string;
	options: GetOptionsSchemaUiDef<Schema['options']['schema']>;
};

export function defineAccessoryUi<const Schema extends AccessoryUiDef<any>>(def: AccessoryUiDef<Schema>): AccessoryUiDef<Schema> {
	return def;
}
