/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mug } from './accessories/mug.js';
import { mikan } from './accessories/mikan.js';
import { bolt } from './accessories/bolt.js';
import type { AvatarAccessoryDef } from './accessory.js';

export const AVATAR_ACCESSORY_DEFS = [
	mug,
	mikan,
	bolt,
] as AvatarAccessoryDef[];

export function getAccessoryDef(type: string): AvatarAccessoryDef {
	const def = AVATAR_ACCESSORY_DEFS.find(x => x.id === type) as AvatarAccessoryDef | undefined;
	if (def == null) {
		throw new Error(`Unrecognized accessory type: ${type}`);
	}
	return def;
}
