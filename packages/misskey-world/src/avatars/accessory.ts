/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { GetRawOptionsSchemaValues, OptionsSchema, RawOptions } from '../mono.js';

export type AccessorySchemaDef<OpSc extends OptionsSchema = OptionsSchema> = {
	id: string;
	options: {
		schema: string extends keyof OpSc ? OptionsSchema : OpSc;
		default: string extends keyof OpSc ? RawOptions : GetRawOptionsSchemaValues<OpSc>; // 関数にした方が使用側でdeepCloneの必要がなくて綺麗かもしれない
	};
};

export function defineAccessorySchema<const OpSc extends OptionsSchema>(def: AccessorySchemaDef<OpSc>): AccessorySchemaDef<OpSc> {
	return def;
}
