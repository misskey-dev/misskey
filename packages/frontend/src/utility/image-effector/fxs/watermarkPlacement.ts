/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import shader from './watermarkPlacement.glsl';

export const FX_watermarkPlacement = defineImageEffectorFx({
	id: 'watermarkPlacement',
	name: '(internal)',
	shader,
	uniforms: ['opacity', 'scale', 'angle', 'cover', 'repeat', 'alignX', 'alignY', 'margin', 'repeatMargin', 'noBBoxExpansion', 'wmResolution', 'wmEnabled', 'watermark'] as const,
	params: {
		cover: {
			type: 'boolean',
			default: false,
		},
		repeat: {
			type: 'boolean',
			default: false,
		},
		scale: {
			type: 'number',
			default: 0.3,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		angle: {
			type: 'number',
			default: 0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
		},
		align: {
			type: 'align',
			default: { x: 'right', y: 'bottom', margin: 0 },
		},
		opacity: {
			type: 'number',
			default: 0.75,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		noBoundingBoxExpansion: {
			type: 'boolean',
			default: false,
		},
		watermark: {
			type: 'texture',
			default: null,
		},
	},
	main: ({ gl, u, params, textures }) => {
		// 基本パラメータ
		gl.uniform1f(u.opacity, params.opacity ?? 1.0);
		gl.uniform1f(u.scale, params.scale ?? 0.3);
		gl.uniform1f(u.angle, params.angle ?? 0.0);
		gl.uniform1i(u.cover, params.cover ? 1 : 0);
		gl.uniform1i(u.repeat, params.repeat ? 1 : 0);
		const ax = params.align?.x === 'left' ? 0 : params.align?.x === 'center' ? 1 : 2;
		const ay = params.align?.y === 'top' ? 0 : params.align?.y === 'center' ? 1 : 2;
		gl.uniform1i(u.alignX, ax);
		gl.uniform1i(u.alignY, ay);
		gl.uniform1f(u.margin, (params.align?.margin ?? 0));
		gl.uniform1f(u.repeatMargin, (params.align?.margin ?? 0));
		gl.uniform1i(u.noBBoxExpansion, params.noBoundingBoxExpansion ? 1 : 0);

		// ウォーターマークテクスチャ
		const wm = textures.watermark;
		if (wm) {
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, wm.texture);

			// リピートモードに応じてWRAP属性を設定
			if (params.repeat) {
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
			} else {
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			}

			gl.uniform1i(u.watermark, 1);
			gl.uniform2f(u.wmResolution, wm.width, wm.height);
			gl.uniform1i(u.wmEnabled, 1);
		} else {
			gl.uniform1i(u.wmEnabled, 0);
		}
	},
});
