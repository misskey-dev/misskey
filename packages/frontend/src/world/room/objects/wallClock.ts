/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const wallClock = defineObject({
	id: 'wallClock',
	name: i18n.ts._miRoom._objects.wallClock,
	options: {
		schema: {
			frameMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._wallClock.frameMat,
			},
		},
		default: {
			frameMat: { color: [0.71, 0.58, 0.39], roughness: 0.75, metallic: 0 },
		},
	},
	placement: 'side',
	hasCollisions: false,
	createInstance: ({ sr, timer, options, model }) => {
		const hourHand = model.findMesh('HandH');
		const minuteHand = model.findMesh('HandM');

		const frameMaterial = model.findMaterial('__X_FRAME__');

		const applyFrameMat = () => {
			frameMaterial.albedoColor = new BABYLON.Color3(options.frameMat.color[0], options.frameMat.color[1], options.frameMat.color[2]);
			frameMaterial.roughness = options.frameMat.roughness;
			frameMaterial.metallic = options.frameMat.metallic;
		};

		applyFrameMat();

		model.bakeExcludeMeshes = [hourHand, minuteHand];

		return {
			onInited: () => {
				// TODO: 家具が撤去された後も呼ばれ続けるのをどうにかする
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
			},
			onOptionsUpdated: ([k, v]) => {
				applyFrameMat();
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
