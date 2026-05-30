/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { coffeeCup_schema } from 'misskey-world/src/room/objects/coffeeCup.schema.js';
import { i18n } from '@/i18n.js';

export const coffeeCup_ui = defineFunitureUi<typeof coffeeCup_schema>({
	name: i18n.ts._miRoom._objects.coffeeCup,
	options: {},
});
