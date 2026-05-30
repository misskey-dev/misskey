/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { usedTissue_schema } from 'misskey-world/src/room/furnitures/usedTissue.schema.js';
import { i18n } from '@/i18n.js';

export const usedTissue_ui = defineFurnitureUi<typeof usedTissue_schema>({
	name: i18n.ts._miRoom._objects.usedTissue,
	options: {},
});
