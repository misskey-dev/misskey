/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import shader from './frame.glsl';

export const FX_frame = defineImageEffectorFx({
	id: 'frame',
	name: '(internal)',
	shader,
	uniforms: ['image', 'topLabel', 'bottomLabel', 'topLabelEnabled', 'bottomLabelEnabled', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'bg'] as const,
	params: {
		image: {
			type: 'textureRef',
			default: null,
		},
		topLabel: {
			type: 'textureRef',
			default: null,
		},
		bottomLabel: {
			type: 'textureRef',
			default: null,
		},
		topLabelEnabled: {
			type: 'boolean',
			default: false,
		},
		bottomLabelEnabled: {
			type: 'boolean',
			default: false,
		},
		paddingTop: {
			type: 'number',
			default: 0,
			max: 1,
			min: 0,
		},
		paddingBottom: {
			type: 'number',
			default: 0,
			max: 1,
			min: 0,
		},
		paddingLeft: {
			type: 'number',
			default: 0,
			max: 1,
			min: 0,
		},
		paddingRight: {
			type: 'number',
			default: 0,
			max: 1,
			min: 0,
		},
		bg: {
			type: 'color',
			default: [1, 1, 1],
		},
	},
	main: ({ gl, u, params, textures }) => {
		const image = textures.image;
		if (image == null) return;

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, image.texture);
		gl.uniform1i(u.image, 1);

		gl.uniform1i(u.topLabelEnabled, params.topLabelEnabled ? 1 : 0);
		gl.uniform1i(u.bottomLabelEnabled, params.bottomLabelEnabled ? 1 : 0);
		gl.uniform1f(u.paddingTop, params.paddingTop);
		gl.uniform1f(u.paddingBottom, params.paddingBottom);
		gl.uniform1f(u.paddingLeft, params.paddingLeft);
		gl.uniform1f(u.paddingRight, params.paddingRight);
		gl.uniform3f(u.bg, params.bg[0], params.bg[1], params.bg[2]);

		if (params.topLabelEnabled) {
			const topLabel = textures.topLabel;
			if (topLabel) {
				gl.activeTexture(gl.TEXTURE2);
				gl.bindTexture(gl.TEXTURE_2D, topLabel.texture);
				gl.uniform1i(u.topLabel, 2);
			}
		}

		if (params.bottomLabelEnabled) {
			const bottomLabel = textures.bottomLabel;
			if (bottomLabel) {
				gl.activeTexture(gl.TEXTURE3);
				gl.bindTexture(gl.TEXTURE_2D, bottomLabel.texture);
				gl.uniform1i(u.bottomLabel, 3);
			}
		}
	},
});
