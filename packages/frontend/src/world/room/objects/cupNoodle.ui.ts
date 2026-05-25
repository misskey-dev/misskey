/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { cupNoodle_schema } from './cupNoodle.schema.js';
import { i18n } from '@/i18n.js';

export const cupNoodle_ui = defineObjectUi<typeof cupNoodle_schema>({
	name: i18n.ts._miRoom._objects.cupNoodle,
	options: {},
});
