/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const radiometer = defineObject({
	id: 'radiometer',
	name: 'radiometer',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
	createInstance: ({ room, scene, model }) => {
		const vanes = model.findTransformNode('__X_VANES__');
		model.bakeExcludeMeshes = [...vanes.getChildMeshes()];

		let animationObserver: BABYLON.Observer<BABYLON.Scene>;

		return {
			onInited: () => {
				vanes.rotation = vanes.rotationQuaternion != null ? vanes.rotationQuaternion.toEulerAngles() : vanes.rotation;
				const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
				anim.setKeys([
					{ frame: 0, value: 0 },
					{ frame: 240, value: Math.PI * 2 },
				]);
				vanes.animations = [anim];
				animationObserver = scene.onAfterAnimationsObservable.add(() => {
					room?.sr.updateMesh([...vanes.getChildMeshes()], true);
				});
				scene.beginAnimation(vanes, 0, 240, true);
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
