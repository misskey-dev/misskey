/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { wireBasket } from './wireBasket.js';
import { i18n } from '@/i18n.js';

export const wireBasket_ui = defineObjectUi<typeof wireBasket>({
	name: i18n.ts._miRoom._objects.wireBasket,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._wireBasket.bodyMat,
		},
	},
});
