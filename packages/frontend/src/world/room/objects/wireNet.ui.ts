/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { wireNet_schema } from 'misskey-world/src/room/objects/wireNet.schema.js';
import { i18n } from '@/i18n.js';

export const wireNet_ui = defineFunitureUi<typeof wireNet_schema>({
	name: i18n.ts._miRoom._objects.wireNet,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._wireNet.bodyMat,
		},
	},
});
