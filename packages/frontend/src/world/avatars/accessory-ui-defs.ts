/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { mug_ui } from './accessories/mug.ui.js';
import { mikan_ui } from './accessories/mikan.ui.js';
import { bolt_ui } from './accessories/bolt.ui.js';
import type { AccessoryUiDef } from './defineAccessoryUi.js';

export const AVATAR_ACCESSORY_UI_DEFS = {
	mug: mug_ui,
	mikan: mikan_ui,
	bolt: bolt_ui,
} as Record<string, AccessoryUiDef>;

export function getAccessoryUiDef(type: string): AccessoryUiDef {
	const def = AVATAR_ACCESSORY_UI_DEFS[type as keyof typeof AVATAR_ACCESSORY_UI_DEFS];
	if (def == null) {
		throw new Error(`Unrecognized accessory type: ${type}`);
	}
	return def;
}
