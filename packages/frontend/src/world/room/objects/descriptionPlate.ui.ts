/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { descriptionPlate } from './descriptionPlate.js';
import { i18n } from '@/i18n.js';

export const descriptionPlate_ui = defineObjectUi<typeof descriptionPlate>({
	name: i18n.ts._miRoom._objects.descriptionPlate,
	options: {},
});
