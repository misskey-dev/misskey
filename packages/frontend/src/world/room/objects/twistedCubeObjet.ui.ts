/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { twistedCubeObjet_schema } from 'misskey-world/src/room/objects/twistedCubeObjet.schema.js';
import { i18n } from '@/i18n.js';

export const twistedCubeObjet_ui = defineFunitureUi<typeof twistedCubeObjet_schema>({
	name: i18n.ts._miRoom._objects.twistedCubeObjet,
	options: {},
});
