/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { OptionsSchema, NumberOptionSchema, BooleanOptionSchema, StringOptionSchema, ColorOptionSchema, MaterialOptionSchema, LightOptionSchema, EnumOptionSchema, RangeOptionSchema, ImageOptionSchema, SeedOptionSchema } from 'misskey-world/src/mono.js';

export type RawOptions = Record<string, unknown> & {
	readonly __brand: unique symbol;
};

export type ConvertedOptions = Record<string, unknown> & {
	readonly __brand: unique symbol;
};

type RawImageValue<Presets extends string = string> = { type: Presets | null | '_custom_'; driveFileId?: string | null; fit?: 'cover' | 'contain' | 'stretch'; };

type ConvertedImageValue<Presets extends string = string> = { type: Presets | null | '_custom_'; custom?: { url: string; } | null; fit?: 'cover' | 'contain' | 'stretch'; };
export type GetConvertedOptionsSchemaValues<T extends OptionsSchema> = {
	[K in keyof T]:
	T[K] extends NumberOptionSchema ? number :
	T[K] extends BooleanOptionSchema ? boolean :
	T[K] extends StringOptionSchema ? string :
	T[K] extends ColorOptionSchema ? [number, number, number] :
	T[K] extends MaterialOptionSchema ? { color: [number, number, number]; metallic: number; roughness: number; } :
	T[K] extends LightOptionSchema ? { color: [number, number, number]; brightness: number; } :
	T[K] extends EnumOptionSchema ? T[K]['enum'][number]['value'] :
	T[K] extends RangeOptionSchema ? number :
	T[K] extends ImageOptionSchema ? ConvertedImageValue<T[K]['presets'][number]['value']> :
	T[K] extends SeedOptionSchema ? number :
	never;
};

export function convertRawOptions<OpSc extends OptionsSchema>(schema: OpSc, raw: RawOptions, attachments: { files: { id: string; url: string; }[] }): ConvertedOptions {
	const converted = {} as ConvertedOptions;
	for (const record of Object.entries(schema)) {
		const k = record[0];
		const v = raw[k];
		if (record[1].type === 'image') {
			const _v = v as unknown as RawImageValue;
			const file = _v.type === '_custom_' ? attachments.files.find(f => f.id === _v.driveFileId) : null;
			if (file != null && file.url.startsWith('http://syu-win.local:3000/')) { // debug
				file.url = file.url.replace('http://syu-win.local:3000/', 'https://local-mi.syuilo.dev/');
			}

			converted[k] = { type: _v.type, custom: file != null ? { url: file.url } : null, fit: _v.fit } satisfies ConvertedImageValue;
		} else {
			converted[k] = v;
		}
	}
	return converted;
}
