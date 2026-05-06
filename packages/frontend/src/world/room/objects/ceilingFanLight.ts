/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const ceilingFanLight = defineObject({
	id: 'ceilingFanLight',
	name: 'Ceiling Fan Light',
	options: {
		schema: {
			shadeColor: {
				type: 'color',
				label: 'Shade color',
			},
		},
		default: {
			shadeColor: [0.8, 0.19, 0],
		},
	},
	placement: 'ceiling',
	hasCollisions: false,
	receiveShadows: false,
	castShadows: false,
	createInstance: ({ options, room, scene, model }) => {
		const shadeMaterial = model.findMaterial('__X_SHADE__');

		const applyShadeColor = () => {
			const [r, g, b] = options.shadeColor;
			shadeMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyShadeColor();

		const rotor = model.findMesh('Rotor');
		model.bakeExcludeMeshes = [rotor, ...rotor.getChildMeshes()];

		let animationObserver: BABYLON.Observer<BABYLON.Scene>;

		return {
			onInited: () => {
				rotor.rotation = rotor.rotationQuaternion != null ? rotor.rotationQuaternion.toEulerAngles() : rotor.rotation;
				const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
				anim.setKeys([
					{ frame: 0, value: 0 },
					{ frame: 100, value: Math.PI * 2 },
				]);
				rotor.animations = [anim];
				animationObserver = scene.onAfterAnimationsObservable.add(() => {
					room?.sr.updateMesh([rotor, ...rotor.getChildMeshes()], false);
				});
				scene.beginAnimation(rotor, 0, 100, true);
			},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'shadeColor': applyShadeColor(); break;
				}
			},
			interactions: {},
			dispose: () => {
				if (animationObserver != null) {
					scene.onAfterAnimationsObservable.remove(animationObserver);
				}
			},
		};
	},
});
