/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { ductTape_schema } from 'misskey-world/src/room/furnitures/ductTape.schema.js';

export const ductTape = defineFuniture(ductTape_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
