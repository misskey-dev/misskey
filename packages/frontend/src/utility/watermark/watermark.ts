/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './watermark.glsl';
import { defineImageCompositorFunction } from '@/lib/ImageCompositor.js';

export const fn = defineImageCompositorFunction<Partial<{
	cover: boolean;
	repeat: boolean;
	scale: number;
	angle: number;
	align: { x: 'left' | 'center' | 'right'; y: 'top' | 'center' | 'bottom'; margin?: number; };
	opacity: number;
	noBoundingBoxExpansion: boolean;
	watermark: string | null;
}>>({
	shader,
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
		const wm = params.watermark ? textures.get(params.watermark) : null;
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
