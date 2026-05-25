/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { lowPartitionBar_schema } from './lowPartitionBar.schema.js';
import { i18n } from '@/i18n.js';

export const lowPartitionBar_ui = defineObjectUi<typeof lowPartitionBar_schema>({
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
