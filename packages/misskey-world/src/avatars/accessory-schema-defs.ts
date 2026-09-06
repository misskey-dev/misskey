/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mug_schema } from './accessories/mug.schema.js';
import { mikan_schema } from './accessories/mikan.schema.js';
import { bolt_schema } from './accessories/bolt.schema.js';
import type { AccessorySchemaDef } from './accessory.js';

export const ACCESSORY_SCHEMA_DEFS = {
	mug: mug_schema,
	mikan: mikan_schema,
	bolt: bolt_schema,
} as Record<string, AccessorySchemaDef<any>>;

export function getAccessorySchemaDef(type: string): AccessorySchemaDef {
	const def = ACCESSORY_SCHEMA_DEFS[type as keyof typeof ACCESSORY_SCHEMA_DEFS];
	if (def == null) {
		throw new Error(`Unrecognized accessory type: ${type}`);
	}
	return def;
}
