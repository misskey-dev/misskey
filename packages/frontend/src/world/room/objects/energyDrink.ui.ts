/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { energyDrink_schema } from './energyDrink.schema.js';
import { i18n } from '@/i18n.js';

export const energyDrink_ui = defineObjectUi<typeof energyDrink_schema>({
	name: i18n.ts._miRoom._objects.energyDrink,
	options: {},
});
