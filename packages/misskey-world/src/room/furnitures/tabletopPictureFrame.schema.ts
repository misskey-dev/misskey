/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureSchema } from '../furniture.js';
export const tabletopPictureFrame_schema = defineFurnitureSchema({
	id: 'tabletopPictureFrame',
	options: {
		schema: {
			frameMat: {
				type: 'material',
			},
			width: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			height: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			frameThickness: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			depth: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			matHThickness: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			matVThickness: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			image: {
				type: 'image',
				presets: [],
			},
		},
		default: {
			frameMat: { color: [0.71, 0.58, 0.39], roughness: 0.5, metallic: 0 },
			width: 0.07,
			height: 0.07,
			frameThickness: 0.1,
			depth: 0,
			matHThickness: 0,
			matVThickness: 0,
			image: { type: null },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
});
