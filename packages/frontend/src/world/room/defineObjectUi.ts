/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ObjectSchemaDef } from 'misskey-world/src/room/object.js';
import type { GetOptionsSchemaUiDef } from '../mono.js';

export type ObjectUiDef<Schema extends ObjectSchemaDef = ObjectSchemaDef> = {
	name: string;
	options: GetOptionsSchemaUiDef<Schema['options']['schema']>;
};

export function defineObjectUi<const Schema extends ObjectSchemaDef<any>>(def: ObjectUiDef<Schema>): ObjectUiDef<Schema> {
	return def;
}
