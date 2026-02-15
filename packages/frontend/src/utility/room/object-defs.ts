/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { blind } from './objects/blind.js';

export const OBJECT_DEFS = [
	blind,
];

export function getObjectDef(type: string): typeof OBJECT_DEFS[number] {
	const def = OBJECT_DEFS.find(x => x.id === type);
	if (def == null) {
		throw new Error(`Unrecognized object type: ${type}`);
	}
	return def;
}
