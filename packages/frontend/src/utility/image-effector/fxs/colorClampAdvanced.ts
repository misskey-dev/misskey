/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

const shader = `#version 300 es
precision mediump float;

in vec2 in_uv;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_rMax;
uniform float u_rMin;
uniform float u_gMax;
uniform float u_gMin;
uniform float u_bMax;
uniform float u_bMin;
out vec4 out_color;

void main() {
	vec4 in_color = texture(u_texture, in_uv);
	float r = min(max(in_color.r, u_rMin), u_rMax);
	float g = min(max(in_color.g, u_gMin), u_gMax);
	float b = min(max(in_color.b, u_bMin), u_bMax);
	out_color = vec4(r, g, b, in_color.a);
}
`;

export const FX_colorClampAdvanced = defineImageEffectorFx({
	id: 'colorClampAdvanced' as const,
	name: i18n.ts._imageEffector._fxs.colorClampAdvanced,
	shader,
	params: {
		rMax: {
			type: 'number' as const,
			default: 1.0,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		rMin: {
			type: 'number' as const,
			default: -1.0,
			min: -1.0,
			max: 0.0,
			step: 0.01,
		},
		gMax: {
			type: 'number' as const,
			default: 1.0,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		gMin: {
			type: 'number' as const,
			default: -1.0,
			min: -1.0,
			max: 0.0,
			step: 0.01,
		},
		bMax: {
			type: 'number' as const,
			default: 1.0,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		bMin: {
			type: 'number' as const,
			default: -1.0,
			min: -1.0,
			max: 0.0,
			step: 0.01,
		},
	},
	main: ({ gl, program, params, preTexture }) => {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, preTexture);
		const u_texture = gl.getUniformLocation(program, 'u_texture');
		gl.uniform1i(u_texture, 0);

		const u_rMax = gl.getUniformLocation(program, 'u_rMax');
		gl.uniform1f(u_rMax, params.rMax);

		const u_rMin = gl.getUniformLocation(program, 'u_rMin');
		gl.uniform1f(u_rMin, 1.0 + params.rMin);

		const u_gMax = gl.getUniformLocation(program, 'u_gMax');
		gl.uniform1f(u_gMax, params.gMax);

		const u_gMin = gl.getUniformLocation(program, 'u_gMin');
		gl.uniform1f(u_gMin, 1.0 + params.gMin);

		const u_bMax = gl.getUniformLocation(program, 'u_bMax');
		gl.uniform1f(u_bMax, params.bMax);

		const u_bMin = gl.getUniformLocation(program, 'u_bMin');
		gl.uniform1f(u_bMin, 1.0 + params.bMin);
	},
});
