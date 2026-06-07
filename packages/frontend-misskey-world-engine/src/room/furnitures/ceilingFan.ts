/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { ceilingFan_schema } from 'misskey-world/src/room/furnitures/ceilingFan.schema.js';
import { defineFuniture } from '../furniture.js';

export const ceilingFan = defineFuniture(ceilingFan_schema, {
	createInstance: ({ options, sr, scene, model }) => {
		const shadeMaterial = model.findMaterial('__X_SHADE__');

		const applyShadeMat = () => {
			shadeMaterial.albedoColor = new BABYLON.Color3(options.shadeMat.color[0], options.shadeMat.color[1], options.shadeMat.color[2]);
			shadeMaterial.roughness = options.shadeMat.roughness;
			shadeMaterial.metallic = options.shadeMat.metallic;
		};

		applyShadeMat();

		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		const rotor = model.findMesh('__X_ROTOR__');
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
					case 'bodyMat': applyBodyMat(); break;
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
