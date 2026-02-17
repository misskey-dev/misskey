/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';
import { get7segMeshesOfCurrentTime, yuge } from '../utility.js';

export const tabletopDigitalClock = defineObject({
	id: 'tabletopDigitalClock',
	defaultOptions: {},
	placement: 'top',
	createInstance: ({ room, root }) => {
		return {
			onInited: () => {
				room.intervalIds.push(window.setInterval(() => {
					const meshes = {
						'1a': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_1A__')),
						'1b': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_1B__')),
						'1c': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_1C__')),
						'1d': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_1D__')),
						'1e': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_1E__')),
						'1f': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_1F__')),
						'1g': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_1G__')),
						'2a': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_2A__')),
						'2b': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_2B__')),
						'2c': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_2C__')),
						'2d': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_2D__')),
						'2e': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_2E__')),
						'2f': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_2F__')),
						'2g': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_2G__')),
						'3a': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_3A__')),
						'3b': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_3B__')),
						'3c': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_3C__')),
						'3d': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_3D__')),
						'3e': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_3E__')),
						'3f': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_3F__')),
						'3g': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_3G__')),
						'4a': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_4A__')),
						'4b': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_4B__')),
						'4c': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_4C__')),
						'4d': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_4D__')),
						'4e': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_4E__')),
						'4f': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_4F__')),
						'4g': root.getChildMeshes().find(m => m.name.includes('__TIME_7SEG_4G__')),
					};

					const onMeshes = get7segMeshesOfCurrentTime(meshes);

					for (const mesh of Object.values(meshes)) {
						mesh.isVisible = onMeshes.includes(mesh);
					}
				}, 1000));
			},
			interactions: {},
		};
	},
});
