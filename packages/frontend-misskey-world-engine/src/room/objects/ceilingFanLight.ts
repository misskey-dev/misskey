/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineFuniture } from '../object.js';
import { ceilingFanLight_schema } from 'misskey-world/src/room/objects/ceilingFanLight.schema.js';

export const ceilingFanLight = defineFuniture(ceilingFanLight_schema, {
	createInstance: ({ options, sr, scene, model }) => {
		const shadeMaterial = model.findMaterial('__X_SHADE__');

		const applyShadeMat = () => {
			shadeMaterial.albedoColor = new BABYLON.Color3(options.shadeMat.color[0], options.shadeMat.color[1], options.shadeMat.color[2]);
			shadeMaterial.roughness = options.shadeMat.roughness;
			shadeMaterial.metallic = options.shadeMat.metallic;
		};

		applyShadeMat();

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
					sr.updateMesh([rotor, ...rotor.getChildMeshes()], false);
				});
				scene.beginAnimation(rotor, 0, 100, true);
			},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'shadeMat': applyShadeMat(); break;
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
