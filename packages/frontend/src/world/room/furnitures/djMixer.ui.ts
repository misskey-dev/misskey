/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { djMixer_schema } from 'misskey-world/src/room/furnitures/djMixer.schema.js';
import { i18n } from '@/i18n.js';

export const djMixer_ui = defineFurnitureUi<typeof djMixer_schema>({
	name: i18n.ts._miRoom._objects.djMixer,
	options: {},
});
