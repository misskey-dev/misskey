/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm } from '../../utility.js';
import { createOverridedStates } from '../utility.js';

export const blind = defineObject({
	id: 'blind',
	name: 'Blind',
	options: {
		schema: {
			blades: {
				type: 'range',
				label: 'Number of blades',
				min: 1,
				max: 100,
			},
			angle: {
				type: 'range',
				label: 'Blade rotation angle (radian)',
				min: -Math.PI / 2,
				max: Math.PI / 2,
				step: 0.01,
			},
			open: {
				type: 'range',
				label: 'Opening state',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			blades: 24,
			angle: 0,
			open: 1,
		},
	},
	placement: 'bottom',
	hasCollisions: false,
	hasTexture: false,
	createInstance: ({ options, model }) => {
		const temp = createOverridedStates({
			angle: () => options.angle,
			open: () => options.open,
		});

		const blade = model.findMesh('__X_BLADE__');
		blade.rotation = new BABYLON.Vector3(options.angle, 0, 0);

		let blades = [] as BABYLON.InstancedMesh[];

		const applyOpeningState = () => {
			for (const b of blades) {
				b.dispose();
			}
			blades = [];

			const matrix = blade.parent.getWorldMatrix(true);
			const scale = new BABYLON.Vector3();
			matrix.decompose(scale);

			for (let i = 0; i < options.blades; i++) {
				const b = blade.clone('blade_' + i); // createInstanceを使いたいが、削除するときになぜかエラーになる
				if (i / options.blades < temp.open) {
					b.position.y -= (i * cm(4)) / Math.abs(scale.y);
				} else {
					b.position.y -= (((options.blades - 1) * temp.open * cm(4)) + (i * cm(0.3))) / Math.abs(scale.y);
				}
				blades.push(b);
			}

			model.updated();
		};

		const applyAngle = () => {
			for (const b of [blade, ...blades]) {
				b.rotation.x = temp.angle;
				b.rotation.x += Math.random() * 0.3 - 0.15;
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
						temp.angle += Math.PI / 8;
						if (temp.angle >= Math.PI / 2) temp.angle = -Math.PI / 2;
						applyAngle();
					},
				},
				openClose: {
					label: 'Open/close',
					fn: () => {
						temp.open -= 0.25;
						if (temp.open < 0) temp.open = 1;
						applyOpeningState();
					},
				},
			},
			onOptionsUpdated: ([k, v]) => {
				temp.$reset();
				switch (k) {
					case 'angle': applyAngle(); break;
					case 'open': applyOpeningState(); break;
					case 'blades': applyOpeningState(); break;
				}
			},
			resetTemporaryState: () => {
				temp.$reset();
				applyAngle();
				applyOpeningState();
			},
			primaryInteraction: 'openClose',
		};
	},
});
