/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { GetOptionsSchemaUiDef, OptionsSchema } from './object.js';

type UiDef<OpSc extends OptionsSchema = OptionsSchema> = {
	name: string;
	options: GetOptionsSchemaUiDef<OpSc>;
};

export function defineObjectUi<const Def extends { options: { schema: OptionsSchema } }>(def: UiDef<Def['options']['schema']>): UiDef<Def['options']['schema']> {
	return def;
}
