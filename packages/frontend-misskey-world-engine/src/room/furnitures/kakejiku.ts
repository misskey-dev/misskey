/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { kakejiku_schema } from 'misskey-world/src/room/furnitures/kakejiku.schema.js';
import { createTextureManager, defineFurniture } from '../furniture.js';

export const kakejiku = defineFurniture(kakejiku_schema, {
	createInstance: async ({ scene, options, model }) => {
		const imageMesh = model.findMesh('__X_IMAGE__');
		imageMesh.rotationQuaternion = null;

		const imageMaterial = model.findMaterial('__X_IMAGE__');
		imageMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);

		const textureManager = createTextureManager(imageMesh, () => 33.5 / 88, scene);

		const applyImage = () => {
			imageMaterial.unfreeze();
			let url: string | null = null;
			if (options.image.type === '_custom_') {
				url = options.image.custom?.url ?? null;
			} else if (options.image.type === 'kitsuaishinsei') {
				url = '/client-assets/world/objects/kakejiku/images/kitsuaishinsei.png';
			}
			return textureManager.change(url, options.image.fit, options.image.rotation).then((tex) => {
				imageMaterial.albedoTexture = tex;
			});
		};

		await applyImage();

		return {
			onInited: () => {

			},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'image':
						applyImage();
						break;
				}
			},
			interactions: {},
			dispose: () => {
				textureManager.dispose();
			},
		};
	},
});
