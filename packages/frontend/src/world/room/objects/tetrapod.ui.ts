/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { tetrapod_schema } from './tetrapod.schema.js';
import { i18n } from '@/i18n.js';

export const tetrapod_ui = defineObjectUi<typeof tetrapod_schema>({
	name: i18n.ts._miRoom._objects.tetrapod,
	options: {},
});
