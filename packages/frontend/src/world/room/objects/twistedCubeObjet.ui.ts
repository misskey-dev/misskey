/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { twistedCubeObjet_schema } from './twistedCubeObjet.schema.js';
import { i18n } from '@/i18n.js';

export const twistedCubeObjet_ui = defineObjectUi<typeof twistedCubeObjet_schema>({
	name: i18n.ts._miRoom._objects.twistedCubeObjet,
	options: {},
});
