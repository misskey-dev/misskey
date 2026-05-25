/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { router } from './router.js';
import { i18n } from '@/i18n.js';

export const router_ui = defineObjectUi<typeof router>({
	name: i18n.ts._miRoom._objects.router,
	options: {},
});
