/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { miPlateDisplayed_schema } from 'misskey-world/src/room/objects/miPlateDisplayed.schema.js';
import { i18n } from '@/i18n.js';

export const miPlateDisplayed_ui = defineObjectUi<typeof miPlateDisplayed_schema>({
	name: i18n.ts._miRoom._objects.miPlateDisplayed,
	options: {},
});
