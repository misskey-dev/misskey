/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { descriptionPlate_schema } from 'misskey-world/src/room/furnitures/descriptionPlate.schema.js';
import { i18n } from '@/i18n.js';

export const descriptionPlate_ui = defineFurnitureUi<typeof descriptionPlate_schema>({
	name: i18n.ts._miRoom._objects.descriptionPlate,
	options: {},
});
