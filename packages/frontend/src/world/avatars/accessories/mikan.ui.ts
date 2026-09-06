/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAccessoryUi } from '../defineAccessoryUi.js';
import type { mikan_schema } from 'misskey-world/src/avatars/accessories/mikan.schema.js';
import { i18n } from '@/i18n.js';

export const mikan_ui = defineAccessoryUi<typeof mikan_schema>({
	name: i18n.ts._miWorld._avatarAccessories.mikan,
	options: {},
});
