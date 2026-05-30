/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { FurnitureSchemaDef } from 'misskey-world/src/room/object.js';
import type { GetOptionsSchemaUiDef } from '../mono.js';

export type FurnitureUiDef<Schema extends FurnitureSchemaDef = FurnitureSchemaDef> = {
	name: string;
	options: GetOptionsSchemaUiDef<Schema['options']['schema']>;
};

export function defineFunitureUi<const Schema extends FurnitureSchemaDef<any>>(def: FurnitureUiDef<Schema>): FurnitureUiDef<Schema> {
	return def;
}
