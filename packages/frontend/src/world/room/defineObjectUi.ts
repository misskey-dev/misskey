/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { GetOptionsSchemaUiDef, OptionsSchema } from './object.js';

export type ObjectUiDef<OpSc extends OptionsSchema = OptionsSchema> = {
	name: string;
	options: GetOptionsSchemaUiDef<OpSc>;
};

export function defineObjectUi<const Def extends { options: { schema: OptionsSchema } }>(def: ObjectUiDef<Def['options']['schema']>): ObjectUiDef<Def['options']['schema']> {
	return def;
}
