/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAccessoryUi } from '../defineAccessoryUi.js';
import type { bolt_schema } from 'misskey-world/src/avatars/accessories/bolt.schema.js';
import { i18n } from '@/i18n.js';

export const bolt_ui = defineAccessoryUi<typeof bolt_schema>({
	name: i18n.ts._miWorld._avatarAccessories.bolt,
	options: {
		mat: {
			label: i18n.ts._miWorld._avatarAccessories._bolt.mat,
		},
	},
});
