/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../object.js';
export const steelRack_schema = defineFurnitureSchema({
	id: 'steelRack',
	options: {
		schema: {
			shelfMat: {
				type: 'material',
			},
			poleMat: {
				type: 'material',
			},
			widthAndDepthVariation: {
				type: 'enum',
				enum: [{
					value: '60-35',
				}, {
					value: '90-35',
				}],
			},
			height: {
				type: 'range',
				min: 1,
				max: 7,
				step: 1,
			},
			numberOfShelfs: {
				type: 'range',
				min: 2,
				max: 10,
				step: 1,
			},
			shelf1Position: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf2Position: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf3Position: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf4Position: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf5Position: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf6Position: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf7Position: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf8Position: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf9Position: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf10Position: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			shelfMat: { color: [0.8, 0.8, 0.8], roughness: 0.25, metallic: 1 },
			poleMat: { color: [0.8, 0.8, 0.8], roughness: 0.25, metallic: 1 },
			widthAndDepthVariation: '60-35',
			height: 5,
			numberOfShelfs: 5,
			shelf1Position: 0.0,
			shelf2Position: 0.3,
			shelf3Position: 0.5,
			shelf4Position: 0.7,
			shelf5Position: 0.95,
			shelf6Position: 1,
			shelf7Position: 1,
			shelf8Position: 1,
			shelf9Position: 1,
			shelf10Position: 1,
		},
	},
	placement: 'floor',
	hasCollisions: true,
	hasTexture: true,
});
