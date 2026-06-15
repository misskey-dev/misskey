/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { emptyBento_schema } from 'misskey-world/src/room/furnitures/emptyBento.schema.js';

export const emptyBento = defineFurniture(emptyBento_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
