/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { plant_schema } from './plant.schema.js';
import { i18n } from '@/i18n.js';

export const plant_ui = defineObjectUi<typeof plant_schema>({
	name: i18n.ts._miRoom._objects.plant,
	options: {},
});
