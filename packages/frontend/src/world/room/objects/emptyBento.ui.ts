/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { emptyBento } from './emptyBento.js';
import { i18n } from '@/i18n.js';

export const emptyBento_ui = defineObjectUi<typeof emptyBento>({
	name: i18n.ts._miRoom._objects.emptyBento,
	options: {},
});
