/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { envelope_schema } from 'misskey-world/src/room/objects/envelope.schema.js';
import { i18n } from '@/i18n.js';

export const envelope_ui = defineFunitureUi<typeof envelope_schema>({
	name: i18n.ts._miRoom._objects.envelope,
	options: {},
});
