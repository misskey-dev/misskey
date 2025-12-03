/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './frame.glsl';
import { defineImageCompositorFunction } from '@/lib/ImageCompositor.js';

export const FN_frame = defineImageCompositorFunction<{
	image: string | null;
	topLabel: string | null;
	bottomLabel: string | null;
	topLabelEnabled: boolean;
	bottomLabelEnabled: boolean;
	paddingTop: number;
	paddingBottom: number;
	paddingLeft: number;
	paddingRight: number;
	bg: [number, number, number];
}>({
	shader,
	main: ({ gl, u, params, textures }) => {
		if (params.image == null) return;
		const image = textures.get(params.image);
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

		if (params.topLabelEnabled && params.topLabel != null) {
			const topLabel = textures.get(params.topLabel);
			if (topLabel) {
				gl.activeTexture(gl.TEXTURE2);
				gl.bindTexture(gl.TEXTURE_2D, topLabel.texture);
				gl.uniform1i(u.topLabel, 2);
			}
		}

		if (params.bottomLabelEnabled && params.bottomLabel != null) {
			const bottomLabel = textures.get(params.bottomLabel);
			if (bottomLabel) {
				gl.activeTexture(gl.TEXTURE3);
				gl.bindTexture(gl.TEXTURE_2D, bottomLabel.texture);
				gl.uniform1i(u.bottomLabel, 3);
			}
		}
	},
});
