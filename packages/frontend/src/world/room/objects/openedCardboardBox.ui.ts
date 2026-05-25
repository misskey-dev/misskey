/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { openedCardboardBox } from './openedCardboardBox.js';
import { i18n } from '@/i18n.js';

export const openedCardboardBox_ui = defineObjectUi<typeof openedCardboardBox>({
	name: i18n.ts._miRoom._objects.openedCardboardBox,
	options: {},
});
