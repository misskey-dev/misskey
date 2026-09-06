/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { curtain_schema } from 'misskey-world/src/room/furnitures/curtain.schema.js';
import { i18n } from '@/i18n.js';

export const curtain_ui = defineFurnitureUi<typeof curtain_schema>({
	name: i18n.ts._miRoom._furnitures.curtain,
	options: {},
});
