/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { djMixer_schema } from 'misskey-world/src/room/objects/djMixer.schema.js';
import { i18n } from '@/i18n.js';

export const djMixer_ui = defineFunitureUi<typeof djMixer_schema>({
	name: i18n.ts._miRoom._objects.djMixer,
	options: {},
});
