/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { herbarium_schema } from 'misskey-world/src/room/furnitures/herbarium.schema.js';
import { defineFuniture } from '../furniture.js';

export const herbarium = defineFuniture(herbarium_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
