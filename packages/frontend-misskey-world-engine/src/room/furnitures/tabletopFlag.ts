/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure';
import { createTextureManager, defineFuniture } from '../furniture.js';
import { tabletopFlag_schema } from 'misskey-world/src/room/furnitures/tabletopFlag.schema.js';

export const tabletopFlag = defineFuniture(tabletopFlag_schema, {
	createInstance: async ({ model, options, scene }) => {
		const flagMesh = model.findMesh('__X_FLAG__');
		const flagMaterial = model.findMaterial('__X_FLAG__');

		const textureManager = createTextureManager(flagMesh, () => 24 / 16, scene);

		const applyImage = () => {
			flagMaterial.unfreeze();
			let url: string | null = null;
			if (options.image.type === '_custom_') {
				url = options.image.custom?.url ?? null;
			}
			return textureManager.change(url, options.image.fit).then((tex) => {
				flagMaterial.albedoTexture = tex;
			});
		};

		await applyImage();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'image': applyImage(); break;
				}
			},
			interactions: {},
			dispose: () => {
				textureManager.dispose();
			},
		};
	},
});
