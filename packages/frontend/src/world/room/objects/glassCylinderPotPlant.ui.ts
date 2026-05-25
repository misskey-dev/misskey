/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { glassCylinderPotPlant } from './glassCylinderPotPlant.js';
import { i18n } from '@/i18n.js';

export const glassCylinderPotPlant_ui = defineObjectUi<typeof glassCylinderPotPlant>({
	name: i18n.ts._miRoom._objects.glassCylinderPotPlant,
	options: {},
});
