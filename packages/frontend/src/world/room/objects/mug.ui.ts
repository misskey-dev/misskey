/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { mug_schema } from './mug.schema.js';
import { i18n } from '@/i18n.js';

export const mug_ui = defineObjectUi<typeof mug_schema>({
	name: i18n.ts._miRoom._objects.mug,
	options: {},
});
