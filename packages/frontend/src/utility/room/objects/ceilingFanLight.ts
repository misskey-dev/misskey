/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const ceilingFanLight = defineObject({
	id: 'ceilingFanLight',
	name: 'Ceiling Fan Light',
	options: {
		schema: {},
		default: {},
	},
	placement: 'ceiling',
	receiveShadows: false,
	castShadows: false,
	createInstance: ({ scene, root }) => {
		return {
			onInited: () => {
				const rotor = root.getChildMeshes().find(m => m.name === 'Rotor') as BABYLON.Mesh;
				rotor.rotation = rotor.rotationQuaternion != null ? rotor.rotationQuaternion.toEulerAngles() : rotor.rotation;
				const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
				anim.setKeys([
					{ frame: 0, value: 0 },
					{ frame: 100, value: Math.PI * 2 },
				]);
				rotor.animations = [anim];
				scene.beginAnimation(rotor, 0, 100, true);
			},
			interactions: {},
		};
	},
});
