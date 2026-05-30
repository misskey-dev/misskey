/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { ductTape_schema } from 'misskey-world/src/room/objects/ductTape.schema.js';
import { i18n } from '@/i18n.js';

export const ductTape_ui = defineFunitureUi<typeof ductTape_schema>({
	name: i18n.ts._miRoom._objects.ductTape,
	options: {},
});
