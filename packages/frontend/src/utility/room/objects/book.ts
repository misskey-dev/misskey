/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const book = defineObject({
	id: 'book',
	defaultOptions: {
		variation: null as number | null,
	},
	placement: 'top',
	createInstance: ({ options, root }) => {
		return {
			onInited: () => {
				const mesh = root.getChildMeshes()[1] as BABYLON.Mesh;
				mesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.UVKind, true);
				const index = options.variation ?? 0;
				const x = index % 8;
				const y = Math.floor(index / 8);

				const uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind)!;
				for (let i = 0; i < uvs.length / 2; i++) {
					const u = uvs[i * 2];
					const v = uvs[i * 2 + 1];
					uvs[i * 2] = (u / 8) + (x / 8);
					uvs[i * 2 + 1] = (v / 8) + (y / 8);
				}
				mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
			},
			interactions: {},
		};
	},
});
