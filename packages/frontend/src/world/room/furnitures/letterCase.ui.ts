/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { letterCase_schema } from 'misskey-world/src/room/furnitures/letterCase.schema.js';
import { i18n } from '@/i18n.js';

export const letterCase_ui = defineFurnitureUi<typeof letterCase_schema>({
	name: i18n.ts._miRoom._furnitures.letterCase,
	options: {},
});
