/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as BABYLON from '@babylonjs/core';
import { defineObject, WORLD_SCALE } from '../engine.js';

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

const remap = (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) => {
	return toMin + ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin);
};

export const randomBooks = defineObject({
	id: 'randomBooks',
	name: 'randomBooks',
	options: {
		schema: {
		},
		default: {
		},
	},
	placement: 'top',
	createInstance: ({ options, model }) => {
		const bodyMesh = model.findMesh('__X_BODY__');

		const count = 4;

		let accumulatedPos = 0;

		for (let i = 0; i < count; i++) {
			const mesh = bodyMesh.clone();
			mesh.makeGeometryUnique();
			mesh.morphTargetManager = bodyMesh.morphTargetManager.clone();
			mesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.UVKind, true);

			const index = Math.floor(Math.random() * 4);
			const x = index % 8;
			const y = Math.floor(index / 8);

			const uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind)!;
			for (let uvi = 0; uvi < uvs.length; uvi += 2) {
				const u = uvs[uvi];
				const v = uvs[uvi + 1];
				uvs[uvi] = (u / 8) + (x / 8);
				uvs[uvi + 1] = (v / 8) + (y / 8);
			}
			mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);

			const width = randomRange(0.15, 0.25);
			const height = randomRange(0.2, 0.3);
			const thickness = randomRange(0, 0.1);
			mesh.morphTargetManager!.getTargetByName('Width')!.influence = width;
			mesh.morphTargetManager!.getTargetByName('Height')!.influence = height;
			mesh.morphTargetManager!.getTargetByName('Thickness')!.influence = thickness;
			const thicknessCm = 1 + remap(thickness, 0, 1, 0, 100);
			mesh.position.x = (accumulatedPos) / WORLD_SCALE;
			accumulatedPos += thicknessCm + 1;
		}

		bodyMesh.isVisible = false;

		model.updated();

		return {
			onInited: () => {

			},
			interactions: {},
		};
	},
});
