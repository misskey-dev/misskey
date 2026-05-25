/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { aircon } from './aircon.js';
import { i18n } from '@/i18n.js';

export const aircon_ui = defineObjectUi<typeof aircon>({
	name: i18n.ts._miRoom._objects.aircon,
	options: {},
});