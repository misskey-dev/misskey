/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { twistedCubeObjet_schema } from 'misskey-world/src/room/objects/twistedCubeObjet.schema.js';

export const twistedCubeObjet = defineFuniture(twistedCubeObjet_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
