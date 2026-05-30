/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { curtain_schema } from 'misskey-world/src/room/objects/curtain.schema.js';
import { i18n } from '@/i18n.js';

export const curtain_ui = defineFunitureUi<typeof curtain_schema>({
	name: i18n.ts._miRoom._objects.curtain,
	options: {},
});
