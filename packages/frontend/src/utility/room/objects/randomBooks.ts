/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import seedrandom from 'seedrandom';
import { defineObject, WORLD_SCALE } from '../engine.js';

const remap = (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) => {
	return toMin + ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin);
};

export const randomBooks = defineObject({
	id: 'randomBooks',
	name: '雑多な本',
	options: {
		schema: {
			plainCover: {
				type: 'boolean',
				label: 'Plain cover',
			},
			count: {
				type: 'range',
				label: 'Count',
				min: 1,
				max: 30,
				step: 1,
			},
			seed: {
				type: 'range',
				label: 'Seed',
				min: 0,
				max: 1000,
				step: 1,
			},
		},
		default: {
			plainCover: false,
			count: 10,
			seed: 0,
		},
	},
	placement: 'top',
	createInstance: ({ options, model, scene, id }) => {
		const bodyMesh = model.findMesh('__X_BODY__');
		const tex = new BABYLON.Texture('/client-assets/room/objects/random-books/texture.png', scene, {
			invertY: false,
			samplingMode: BABYLON.Texture.NEAREST_SAMPLINGMODE,
		});
		bodyMesh.material.albedoTexture = tex;

		const TEXTURE_DIVISION = 8;
		let bookMeshes: BABYLON.Mesh[] = [];

		const gen = () => {
			for (const m of bookMeshes) {
				m.dispose();
			}
			bookMeshes = [];

			const rng = seedrandom(options.seed === 0 ? id : options.seed.toString());
			const randomRange = (min: number, max: number) => rng() * (max - min) + min;

			let accumulatedPos = 0;

			for (let i = 0; i < options.count; i++) {
				const mesh = bodyMesh.clone();
				mesh.isVisible = true;
				mesh.setEnabled(true);
				mesh.makeGeometryUnique();
				mesh.morphTargetManager = bodyMesh.morphTargetManager.clone();
				mesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.UVKind, true);

				const index = Math.floor(rng() * (TEXTURE_DIVISION * TEXTURE_DIVISION));
				const x = index % TEXTURE_DIVISION;
				const y = Math.floor(index / TEXTURE_DIVISION);

				const uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind)!;
				for (let uvi = 0; uvi < uvs.length; uvi += 2) {
					const u = uvs[uvi];
					const v = uvs[uvi + 1];
					uvs[uvi] = (u / TEXTURE_DIVISION) + (x / TEXTURE_DIVISION);
					uvs[uvi + 1] = (v / TEXTURE_DIVISION) + (y / TEXTURE_DIVISION);
				}
				mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);

				const width = randomRange(0.125, 0.175);
				const height = randomRange(0.3, 0.4);
				const thickness = randomRange(0, 0.03);
				mesh.morphTargetManager!.getTargetByName('Width')!.influence = width;
				mesh.morphTargetManager!.getTargetByName('Height')!.influence = height;
				mesh.morphTargetManager!.getTargetByName('Thickness')!.influence = thickness;
				const thicknessCm = 2 + remap(thickness, 0, 1, 0, 100);
				const widthCm = 2 + remap(width, 0, 1, 0, 100);
				const gap = 0.25;
				mesh.position.x = (accumulatedPos + (thicknessCm / 2)) / WORLD_SCALE;
				mesh.position.z = widthCm / 2 / WORLD_SCALE;
				mesh.refreshBoundingInfo();
				mesh.computeWorldMatrix(true);
				accumulatedPos += thicknessCm + gap;
				bookMeshes.push(mesh);
			}

			// centering
			for (let i = 0; i < options.count; i++) {
				bookMeshes[i].position.x -= accumulatedPos / 2 / WORLD_SCALE;
			}

			bodyMesh.isVisible = false;

			model.updated();
		};

		gen();

		return {
			onInited: () => {

			},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'seed': gen(); break;
					case 'count': gen(); break;
				}
			},
			interactions: {},
		};
	},
});
