/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { herbarium_schema } from 'misskey-world/src/room/furnitures/herbarium.schema.js';
import { i18n } from '@/i18n.js';

export const herbarium_ui = defineFurnitureUi<typeof herbarium_schema>({
	name: i18n.ts._miRoom._furnitures.herbarium,
	options: {},
});
