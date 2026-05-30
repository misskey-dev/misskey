/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { woodSoundAbsorbingPanel_schema } from 'misskey-world/src/room/furnitures/woodSoundAbsorbingPanel.schema.js';

export const woodSoundAbsorbingPanel = defineFuniture(woodSoundAbsorbingPanel_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
