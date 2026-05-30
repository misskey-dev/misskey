/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { custardPudding_schema } from 'misskey-world/src/room/objects/custardPudding.schema.js';
import { i18n } from '@/i18n.js';

export const custardPudding_ui = defineFunitureUi<typeof custardPudding_schema>({
	name: i18n.ts._miRoom._objects.custardPudding,
	options: {},
});
