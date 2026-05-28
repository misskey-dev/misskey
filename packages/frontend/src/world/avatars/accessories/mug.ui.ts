/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAccessoryUi } from '../defineAccessoryUi.js';
import type { mug_schema } from 'misskey-world/src/avatars/accessories/mug.schema.js';
import { i18n } from '@/i18n.js';

export const mug_ui = defineAccessoryUi<typeof mug_schema>({
	name: i18n.ts._miWorld._avatarAccessories.mug,
	options: {
		bodyMat: {
			label: i18n.ts._miWorld._avatarAccessories._mug.bodyMat,
		},
		liquidMat: {
			label: i18n.ts._miWorld._avatarAccessories._mug.liquidMat,
		},
	},
});
