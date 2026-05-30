/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { emptyBento_schema } from 'misskey-world/src/room/objects/emptyBento.schema.js';
import { i18n } from '@/i18n.js';

export const emptyBento_ui = defineFunitureUi<typeof emptyBento_schema>({
	name: i18n.ts._miRoom._objects.emptyBento,
	options: {},
});
