/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { facialTissue_schema } from 'misskey-world/src/room/furnitures/facialTissue.schema.js';
import { i18n } from '@/i18n.js';

export const facialTissue_ui = defineFurnitureUi<typeof facialTissue_schema>({
	name: i18n.ts._miRoom._objects.facialTissue,
	options: {},
});
