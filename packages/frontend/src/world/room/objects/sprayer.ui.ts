/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { sprayer_schema } from 'misskey-world/src/room/objects/sprayer.schema.js';
import { i18n } from '@/i18n.js';

export const sprayer_ui = defineFunitureUi<typeof sprayer_schema>({
	name: i18n.ts._miRoom._objects.sprayer,
	options: {},
});
