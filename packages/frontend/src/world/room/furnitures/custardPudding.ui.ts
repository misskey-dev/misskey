/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { custardPudding_schema } from 'misskey-world/src/room/furnitures/custardPudding.schema.js';
import { i18n } from '@/i18n.js';

export const custardPudding_ui = defineFurnitureUi<typeof custardPudding_schema>({
	name: i18n.ts._miRoom._furnitures.custardPudding,
	options: {},
});
