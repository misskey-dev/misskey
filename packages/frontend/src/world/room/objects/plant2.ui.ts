/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { plant2_schema } from './plant2.schema.js';
import { i18n } from '@/i18n.js';

export const plant2_ui = defineObjectUi<typeof plant2_schema>({
	name: i18n.ts._miRoom._objects.plant2,
	options: {},
});
