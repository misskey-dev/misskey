/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { powerStrip } from './powerStrip.js';
import { i18n } from '@/i18n.js';

export const powerStrip_ui = defineObjectUi<typeof powerStrip>({
	name: i18n.ts._miRoom._objects.powerStrip,
	options: {},
});
