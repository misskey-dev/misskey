/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { sprayer_schema } from 'misskey-world/src/room/furnitures/sprayer.schema.js';
import { i18n } from '@/i18n.js';

export const sprayer_ui = defineFurnitureUi<typeof sprayer_schema>({
	name: i18n.ts._miRoom._objects.sprayer,
	options: {},
});
