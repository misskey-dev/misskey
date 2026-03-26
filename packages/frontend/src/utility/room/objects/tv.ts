/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';
import { initTv } from '../utility.js';

export const tv = defineObject({
	id: 'tv',
	name: 'TV',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	createInstance: ({ scene, root }) => {
		const screenMesh = root.getChildMeshes().find(m => m.name.includes('__TV_SCREEN__')) as BABYLON.Mesh;
		screenMesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.UVKind, true);

		initTv(scene, screenMesh);

		return {
			interactions: {},
		};
	},
});
