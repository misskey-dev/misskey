/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const cardboardBox = defineObject({
	id: 'cardboardBox',
	name: 'Cardboard Box',
	options: {
		schema: {
			variation: {
				type: 'enum',
				label: 'Variation',
				enum: ['default', 'mikan', 'aizon'],
			},
		},
		default: {
			variation: 'default',
		},
	},
	placement: 'top',
	createInstance: ({ room, options, root }) => {
		return {
			onInited: () => {
				const boxMesh = root.getChildMeshes().find(m => m.name === 'Box') as BABYLON.Mesh;
				if (options.variation === 'mikan') {
					const tex = new BABYLON.Texture('/client-assets/room/objects/cardboard-box/textures/mikan.png', room.scene, false, false);
					(boxMesh.material as BABYLON.PBRMaterial).albedoTexture = tex;
					(boxMesh.material as BABYLON.PBRMaterial).albedoColor = new BABYLON.Color3(1, 1, 1);
				} else if (options.variation === 'aizon') {
					const tex = new BABYLON.Texture('/client-assets/room/objects/cardboard-box/textures/aizon.png', room.scene, false, false);
					(boxMesh.material as BABYLON.PBRMaterial).albedoTexture = tex;
					(boxMesh.material as BABYLON.PBRMaterial).albedoColor = new BABYLON.Color3(1, 1, 1);
				}
			},
			interactions: {},
		};
	},
});
