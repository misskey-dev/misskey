/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { lowPartitionBar_schema } from 'misskey-world/src/room/objects/lowPartitionBar.schema.js';
import { i18n } from '@/i18n.js';

export const lowPartitionBar_ui = defineFunitureUi<typeof lowPartitionBar_schema>({
	name: i18n.ts._miRoom._objects.lowPartitionBar,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._lowPartitionBar.bodyMat,
		},
		width: {
			label: i18n.ts._miRoom._objects._lowPartitionBar.width,
		},
	},
});
