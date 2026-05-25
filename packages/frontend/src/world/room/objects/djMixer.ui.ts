/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { djMixer_schema } from './djMixer.schema.js';
import { i18n } from '@/i18n.js';

export const djMixer_ui = defineObjectUi<typeof djMixer_schema>({
	name: i18n.ts._miRoom._objects.djMixer,
	options: {},
});
