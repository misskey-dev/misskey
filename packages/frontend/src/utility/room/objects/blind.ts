/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject, WORLD_SCALE } from '../engine.js';

export const blind = defineObject({
	id: 'blind',
	defaultOptions: {
		blades: 24,
		angle: 0,
		open: 1,
	},
	placement: 'bottom',
	createInstance: ({ room, o, loaderResult, meshUpdated }) => {
		const blade = loaderResult.meshes[0].getChildMeshes().find(m => m.name === 'Blade') as BABYLON.Mesh;
		blade.rotation = new BABYLON.Vector3(o.options.angle, 0, 0);

		let blades = [] as BABYLON.Mesh[];

		const applyOpeningState = () => {
			for (const b of blades) {
				b.dispose();
			}
			blades = [];

			for (let i = 0; i < o.options.blades; i++) {
				if (i / o.options.blades > o.options.open) continue;

				const b = blade.clone();
				b.position.y -= (i * 4/*cm*/) / WORLD_SCALE;
				blades.push(b);
			}

			meshUpdated();
		};

		const applyAngle = () => {
			for (const b of [blade, ...blades]) {
				b.rotation.x = o.options.angle;
			}
		};

		applyOpeningState();
		applyAngle();

		return {
			onInited: () => {

			},
			interactions: {
				adjustBladeRotation: {
					label: 'Adjust blade rotation',
					fn: () => {
						o.options.angle += Math.PI / 8;
						if (o.options.angle >= Math.PI / 2) o.options.angle = -Math.PI / 2;
						applyAngle();
					},
				},
				openClose: {
					label: 'Open/close',
					fn: () => {
						o.options.open -= 0.25;
						if (o.options.open < 0) o.options.open = 1;
						applyOpeningState();
					},
				},
			},
			primaryInteraction: 'openClose',
		};
	},
});
