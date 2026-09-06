/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { wallClock_schema } from 'misskey-world/src/room/furnitures/wallClock.schema.js';
import { defineFurniture } from '../furniture.js';

export const wallClock = defineFurniture(wallClock_schema, {
	createInstance: ({ sr, timer, options, model }) => {
		const hourHand = model.findMesh('__X_HAND_H__');
		const minuteHand = model.findMesh('__X_HAND_M__');

		const frameMaterial = model.findMaterial('__X_FRAME__');

		const applyFrameMat = () => {
			frameMaterial.albedoColor = new BABYLON.Color3(options.frameMat.color[0], options.frameMat.color[1], options.frameMat.color[2]);
			frameMaterial.roughness = options.frameMat.roughness;
			frameMaterial.metallic = options.frameMat.metallic;
		};

		applyFrameMat();

		const faceMaterial = model.findMaterial('__X_FACE__');

		const applyFaceMat = () => {
			faceMaterial.albedoColor = new BABYLON.Color3(options.faceMat.color[0], options.faceMat.color[1], options.faceMat.color[2]);
			faceMaterial.roughness = options.faceMat.roughness;
			faceMaterial.metallic = options.faceMat.metallic;
		};

		applyFaceMat();

		const handsMaterial = model.findMaterial('__X_HAND__');

		const applyHandsMat = () => {
			handsMaterial.albedoColor = new BABYLON.Color3(options.handsMat.color[0], options.handsMat.color[1], options.handsMat.color[2]);
			handsMaterial.roughness = options.handsMat.roughness;
			handsMaterial.metallic = options.handsMat.metallic;
		};

		applyHandsMat();

		model.bakeExcludeMeshes = [hourHand, minuteHand];

		timer.setInterval(() => {
			const now = new Date();
			const hours = now.getHours() % 12;
			const minutes = now.getMinutes();
			const hAngle = -(hours / 12) * Math.PI * 2 - (minutes / 60) * (Math.PI * 2 / 12);
			const mAngle = -(minutes / 60) * Math.PI * 2;
			hourHand.rotation = new BABYLON.Vector3(0, 0, hAngle);
			minuteHand.rotation = new BABYLON.Vector3(0, 0, mAngle);
			sr.updateMesh([hourHand, minuteHand], false);
		}, 1000);

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'frameMat': applyFrameMat(); break;
					case 'faceMat': applyFaceMat(); break;
					case 'handsMat': applyHandsMat(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
