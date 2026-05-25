/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectSchema } from '../object.js';
export const pictureFrame_schema = defineObjectSchema({
	id: 'pictureFrame',
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
			withCover: {
				type: 'boolean',
			},
			image: {
				type: 'image',
				presets: [],
			},
		},
		default: {
			frameMat: { color: [0.71, 0.58, 0.39], roughness: 0.5, metallic: 0 },
			width: 0.15,
			height: 0.15,
			frameThickness: 0.3,
			depth: 0,
			matHThickness: 0.35,
			matVThickness: 0.35,
			withCover: true,
			image: { type: null },
		},
	},
	placement: 'side',
	hasCollisions: false,
	hasTexture: true,
});
