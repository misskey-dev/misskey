/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { twistedCubeObjet_schema } from 'misskey-world/src/room/furnitures/twistedCubeObjet.schema.js';

export const twistedCubeObjet = defineFurniture(twistedCubeObjet_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
