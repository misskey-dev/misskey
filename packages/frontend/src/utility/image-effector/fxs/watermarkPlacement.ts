/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';

export const FX_watermarkPlacement = defineImageEffectorFx({
	id: 'watermarkPlacement' as const,
	name: '(internal)',
	shader: () => import('./watermarkPlacement.glsl?raw').then(m => m.default),
	uniforms: ['texture_watermark', 'resolution_watermark', 'scale', 'angle', 'opacity', 'repeat', 'alignX', 'alignY', 'fitMode'] as const,
	params: {
		cover: {
			type: 'boolean' as const,
			default: false,
		},
		repeat: {
			type: 'boolean' as const,
			default: false,
		},
		scale: {
			type: 'number' as const,
			default: 0.3,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		angle: {
			type: 'number' as const,
			default: 0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
		},
		align: {
			type: 'align' as const,
			default: { x: 'right', y: 'bottom' },
		},
		opacity: {
			type: 'number' as const,
			default: 0.75,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		watermark: {
			type: 'texture' as const,
			default: null,
		},
	},
	main: ({ gl, u, params, textures }) => {
		if (textures.watermark == null) {
			return;
		}

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, textures.watermark.texture);
		gl.uniform1i(u.texture_watermark, 1);

		gl.uniform2fv(u.resolution_watermark, [textures.watermark.width, textures.watermark.height]);
		gl.uniform1f(u.scale, params.scale);

		gl.uniform1f(u.opacity, params.opacity);
		gl.uniform1f(u.angle, params.angle);
		gl.uniform1i(u.repeat, params.repeat ? 1 : 0);
		gl.uniform1i(u.alignX, params.align.x === 'left' ? 0 : params.align.x === 'right' ? 2 : 1);
		gl.uniform1i(u.alignY, params.align.y === 'top' ? 0 : params.align.y === 'bottom' ? 2 : 1);
		gl.uniform1i(u.fitMode, params.cover ? 1 : 0);
	},
});
