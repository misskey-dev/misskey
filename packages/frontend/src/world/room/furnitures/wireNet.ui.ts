/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { wireNet_schema } from 'misskey-world/src/room/furnitures/wireNet.schema.js';
import { i18n } from '@/i18n.js';

export const wireNet_ui = defineFurnitureUi<typeof wireNet_schema>({
	name: i18n.ts._miRoom._objects.wireNet,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._wireNet.bodyMat,
		},
	},
});
