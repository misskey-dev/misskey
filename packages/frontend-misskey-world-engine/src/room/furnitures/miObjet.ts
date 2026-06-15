/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { miObjet_schema } from 'misskey-world/src/room/furnitures/miObjet.schema.js';

export const miObjet = defineFurniture(miObjet_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
