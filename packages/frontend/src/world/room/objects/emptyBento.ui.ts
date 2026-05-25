/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { emptyBento_schema } from './emptyBento.schema.js';
import { i18n } from '@/i18n.js';

export const emptyBento_ui = defineObjectUi<typeof emptyBento_schema>({
	name: i18n.ts._miRoom._objects.emptyBento,
	options: {},
});
