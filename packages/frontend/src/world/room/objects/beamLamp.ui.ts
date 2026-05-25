/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { beamLamp } from './beamLamp.js';
import { i18n } from '@/i18n.js';

export const beamLamp_ui = defineObjectUi<typeof beamLamp>({
	name: i18n.ts._miRoom._objects.beamLamp,
	options: {},
});
