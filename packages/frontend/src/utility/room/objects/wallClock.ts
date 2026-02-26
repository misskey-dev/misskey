/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const wallClock = defineObject({
	id: 'wallClock',
	name: 'Wall Clock',
	options: {
		schema: {
			frameColor: {
				type: 'color',
				label: 'Frame color',
			},
		},
		default: {
			frameColor: [0.71, 0.58, 0.39],
		},
	},
	placement: 'side',
	createInstance: ({ room, root, options, findMaterial }) => {
		const frameMaterial = findMaterial('__X_FRAME__');

		const applyFrameColor = () => {
			const [r, g, b] = options.frameColor;
			frameMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyFrameColor();

		return {
			onInited: () => {
				const hourHand = root.getChildMeshes().find(m => m.name === 'HandH') as BABYLON.Mesh;
				const minuteHand = root.getChildMeshes().find(m => m.name === 'HandM') as BABYLON.Mesh;
				room.intervalIds.push(window.setInterval(() => {
					const now = new Date();
					const hours = now.getHours() % 12;
					const minutes = now.getMinutes();
					const hAngle = -(hours / 12) * Math.PI * 2 - (minutes / 60) * (Math.PI * 2 / 12);
					const mAngle = -(minutes / 60) * Math.PI * 2;
					hourHand.rotation = new BABYLON.Vector3(0, 0, hAngle);
					minuteHand.rotation = new BABYLON.Vector3(0, 0, mAngle);
				}, 1000));
			},
			onOptionsUpdated: ([k, v]) => {
				applyFrameColor();
			},
			interactions: {},
		};
	},
});
