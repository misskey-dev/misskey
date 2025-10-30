/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import shader from './label.glsl';

export const FX_label = defineImageEffectorFx({
	id: 'label',
	name: '(internal)',
	shader,
	uniforms: ['image', 'label', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'] as const,
	params: {
		image: {
			type: 'textureRef',
			default: null,
		},
		label: {
			type: 'textureRef',
			default: null,
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
	},
	main: ({ gl, u, params, textures }) => {
		const image = textures.image;
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, image.texture);
		gl.uniform1i(u.image, 1);

		gl.uniform1f(u.paddingTop, params.paddingTop);
		gl.uniform1f(u.paddingBottom, params.paddingBottom);
		gl.uniform1f(u.paddingLeft, params.paddingLeft);
		gl.uniform1f(u.paddingRight, params.paddingRight);

		const label = textures.label;
		if (label) {
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, label.texture);
			gl.uniform1i(u.label, 2);
		}
	},
});
