/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { powerStrip_schema } from 'misskey-world/src/room/furnitures/powerStrip.schema.js';
import { i18n } from '@/i18n.js';

export const powerStrip_ui = defineFurnitureUi<typeof powerStrip_schema>({
	name: i18n.ts._miRoom._furnitures.powerStrip,
	options: {},
});
