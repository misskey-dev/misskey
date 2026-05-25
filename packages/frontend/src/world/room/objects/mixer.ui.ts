/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { mixer } from './mixer.js';
import { i18n } from '@/i18n.js';

export const mixer_ui = defineObjectUi<typeof mixer>({
	name: i18n.ts._miRoom._objects.mixer,
	options: {},
});
