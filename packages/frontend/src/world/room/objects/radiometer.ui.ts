/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { radiometer_schema } from './radiometer.schema.js';
import { i18n } from '@/i18n.js';

export const radiometer_ui = defineObjectUi<typeof radiometer_schema>({
	name: i18n.ts._miRoom._objects.radiometer,
	options: {},
});
