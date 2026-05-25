/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { djMixer } from './djMixer.js';
import { i18n } from '@/i18n.js';

export const djMixer_ui = defineObjectUi<typeof djMixer>({
	name: i18n.ts._miRoom._objects.djMixer,
	options: {},
});
