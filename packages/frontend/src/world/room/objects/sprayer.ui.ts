/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { sprayer_schema } from './sprayer.schema.js';
import { i18n } from '@/i18n.js';

export const sprayer_ui = defineObjectUi<typeof sprayer_schema>({
	name: i18n.ts._miRoom._objects.sprayer,
	options: {},
});
