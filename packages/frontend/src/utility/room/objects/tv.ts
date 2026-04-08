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
	createInstance: ({ room, model }) => {
		const screenMesh = model.findMesh('__TV_SCREEN__');
		screenMesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.UVKind, true);

		model.bakeExcludeMeshes = [screenMesh];

		initTv(room, screenMesh);

		return {
			interactions: {},
		};
	},
});
