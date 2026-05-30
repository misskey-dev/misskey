/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { wireBasket_schema } from 'misskey-world/src/room/objects/wireBasket.schema.js';
import { i18n } from '@/i18n.js';

export const wireBasket_ui = defineFunitureUi<typeof wireBasket_schema>({
	name: i18n.ts._miRoom._objects.wireBasket,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._wireBasket.bodyMat,
		},
	},
});
