/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { router_schema } from 'misskey-world/src/room/objects/router.schema.js';
import { i18n } from '@/i18n.js';

export const router_ui = defineFunitureUi<typeof router_schema>({
	name: i18n.ts._miRoom._objects.router,
	options: {},
});
