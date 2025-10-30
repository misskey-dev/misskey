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
	uniforms: ['image', 'label', 'labelResolution', 'labelEnabled', 'imageMarginX', 'imageMarginY'] as const,
	params: {
		image: {
			type: 'textureRef',
			default: null,
		},
		label: {
			type: 'textureRef',
			default: null,
		},
		imageMarginX: {
			type: 'number',
			default: 0.05,
			max: 1,
			min: 0,
		},
		imageMarginY: {
			type: 'number',
			default: 0.05,
			max: 1,
			min: 0,
		},
	},
	main: ({ gl, u, params, textures }) => {
		const image = textures.image;
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, image.texture);
		gl.uniform1i(u.image, 1);

		gl.uniform1f(u.imageMarginX, params.imageMarginX);
		gl.uniform1f(u.imageMarginY, params.imageMarginY);

		const label = textures.label;
		if (label) {
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, label.texture);

			gl.uniform1i(u.label, 2);
			gl.uniform2f(u.labelResolution, label.width, label.height);
			gl.uniform1i(u.labelEnabled, 1);
		} else {
			gl.uniform1i(u.labelEnabled, 0);
		}
	},
});
