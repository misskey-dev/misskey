/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm, get7segMeshesOfCurrentTime, WORLD_SCALE } from '@/world/utility.js';

export const tabletopDigitalClock = defineObject({
	id: 'tabletopDigitalClock',
	name: 'Tabletop Digital Clock',
	options: {
		schema: {
			bodyStyle: {
				type: 'enum',
				label: 'Body Style',
				enum: ['color', 'wood'],
			},
			bodyColor: {
				type: 'color',
				label: 'Body Color',
			},
			lcdColor: {
				type: 'color',
				label: 'LCD Color',
			},
		},
		default: {
			bodyStyle: 'color',
			bodyColor: [0.45, 0.8, 0],
			lcdColor: [1, 1, 1],
		},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: false,
	createInstance: ({ root, room, options, model, scene, timer }) => {
		const light = new BABYLON.SpotLight('', new BABYLON.Vector3(0, cm(3), cm(1)), new BABYLON.Vector3(0, 0, 1), Math.PI / 1, 2, scene, room?.lightContainer != null);
		light.parent = root;
		light.intensity = 0.01 * WORLD_SCALE * WORLD_SCALE;
		light.range = cm(30);
		if (room?.lightContainer != null) room.lightContainer.addLight(light);

		const segmentMeshes = {
			'1a': model.findMesh('__TIME_7SEG_1A__'),
			'1b': model.findMesh('__TIME_7SEG_1B__'),
			'1c': model.findMesh('__TIME_7SEG_1C__'),
			'1d': model.findMesh('__TIME_7SEG_1D__'),
			'1e': model.findMesh('__TIME_7SEG_1E__'),
			'1f': model.findMesh('__TIME_7SEG_1F__'),
			'1g': model.findMesh('__TIME_7SEG_1G__'),
			'2a': model.findMesh('__TIME_7SEG_2A__'),
			'2b': model.findMesh('__TIME_7SEG_2B__'),
			'2c': model.findMesh('__TIME_7SEG_2C__'),
			'2d': model.findMesh('__TIME_7SEG_2D__'),
			'2e': model.findMesh('__TIME_7SEG_2E__'),
			'2f': model.findMesh('__TIME_7SEG_2F__'),
			'2g': model.findMesh('__TIME_7SEG_2G__'),
			'3a': model.findMesh('__TIME_7SEG_3A__'),
			'3b': model.findMesh('__TIME_7SEG_3B__'),
			'3c': model.findMesh('__TIME_7SEG_3C__'),
			'3d': model.findMesh('__TIME_7SEG_3D__'),
			'3e': model.findMesh('__TIME_7SEG_3E__'),
			'3f': model.findMesh('__TIME_7SEG_3F__'),
			'3g': model.findMesh('__TIME_7SEG_3G__'),
			'4a': model.findMesh('__TIME_7SEG_4A__'),
			'4b': model.findMesh('__TIME_7SEG_4B__'),
			'4c': model.findMesh('__TIME_7SEG_4C__'),
			'4d': model.findMesh('__TIME_7SEG_4D__'),
			'4e': model.findMesh('__TIME_7SEG_4E__'),
			'4f': model.findMesh('__TIME_7SEG_4F__'),
			'4g': model.findMesh('__TIME_7SEG_4G__'),
		};

		const colonMeshes = model.findMeshes('__TIME_7SEG_COLON__');

		model.bakeExcludeMeshes = Object.values(segmentMeshes).concat(colonMeshes);

		const bodyMesh = model.findMesh('__X_BODY__');
		const bodyMaterial = bodyMesh.material as BABYLON.PBRMaterial;

		const applyBodyColor = () => {
			if (options.bodyStyle === 'color') {
				const [r, g, b] = options.bodyColor;
				bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
			} else {

			}
		};

		const applyLcdColor = () => {
			const mat = segmentMeshes['1a'].material as BABYLON.PBRMaterial;
			const [r, g, b] = options.lcdColor;
			mat.emissiveColor = new BABYLON.Color3(r, g, b);
			light.diffuse = new BABYLON.Color3(r, g, b);
		};

		return {
			onInited: () => {
				applyBodyColor();
				applyLcdColor();

				// TODO: 家具が撤去された後も呼ばれ続けるのをどうにかする
				timer.setInterval(() => {
					const onMeshes = get7segMeshesOfCurrentTime(segmentMeshes);

					for (const mesh of Object.values(segmentMeshes)) {
						const isVisible = onMeshes.includes(mesh);
						mesh.isVisible = isVisible;
					}

					for (const mesh of colonMeshes) {
						const isVisible = Date.now() % 2000 < 1000;
						mesh.isVisible = isVisible;
					}

					// なぜか反映されない。バグ？ https://forum.babylonjs.com/t/visibility-of-instancedmesh-is-not-reflected-under-fast-snapshot-rendering/63251
					room?.sr.updateMesh([...Object.values(segmentMeshes), ...colonMeshes]);
				}, 1000);
			},
			onOptionsUpdated: ([k, v]) => {
				if (k === 'bodyColor') {
					applyBodyColor();
				} else if (k === 'lcdColor') {
					applyLcdColor();
				}
			},
			interactions: {},
		};
	},
});
