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
uniform vec2 u_pos;
uniform float u_frequency;
uniform bool u_thresholdEnabled;
uniform float u_threshold;
uniform float u_maskSize;
uniform bool u_black;
out vec4 out_color;

void main() {
	vec4 in_color = texture(u_texture, in_uv);
	float angle = atan(-u_pos.y + (in_uv.y), -u_pos.x + (in_uv.x));
	float t = (1.0 + sin(angle * u_frequency)) / 2.0;
	if (u_thresholdEnabled) t = t > u_threshold ? 1.0 : 0.0;
	float d = distance(in_uv * vec2(2.0, 2.0), u_pos * vec2(2.0, 2.0));
	float mask = d < u_maskSize ? 0.0 : ((d - u_maskSize) * (1.0 + (u_maskSize * 2.0)));
	out_color = vec4(
		mix(in_color.r, u_black ? 0.0 : 1.0, t * mask),
		mix(in_color.g, u_black ? 0.0 : 1.0, t * mask),
		mix(in_color.b, u_black ? 0.0 : 1.0, t * mask),
		in_color.a
	);
}
`;

export const FX_zoomLines = defineImageEffectorFx({
	id: 'zoomLines' as const,
	name: i18n.ts._imageEffector._fxs.zoomLines,
	shader,
	params: {
		x: {
			type: 'number' as const,
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
		},
		y: {
			type: 'number' as const,
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
		},
		frequency: {
			type: 'number' as const,
			default: 30.0,
			min: 1.0,
			max: 200.0,
			step: 0.1,
		},
		thresholdEnabled: {
			type: 'boolean' as const,
			default: true,
		},
		threshold: {
			type: 'number' as const,
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		maskSize: {
			type: 'number' as const,
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		black: {
			type: 'boolean' as const,
			default: false,
		},
	},
	main: ({ gl, program, params, preTexture }) => {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, preTexture);
		const u_texture = gl.getUniformLocation(program, 'u_texture');
		gl.uniform1i(u_texture, 0);

		const u_pos = gl.getUniformLocation(program, 'u_pos');
		gl.uniform2f(u_pos, (1.0 + params.x) / 2.0, (1.0 + params.y) / 2.0);

		const u_frequency = gl.getUniformLocation(program, 'u_frequency');
		gl.uniform1f(u_frequency, params.frequency);

		const u_thresholdEnabled = gl.getUniformLocation(program, 'u_thresholdEnabled');
		gl.uniform1i(u_thresholdEnabled, params.thresholdEnabled ? 1 : 0);

		const u_threshold = gl.getUniformLocation(program, 'u_threshold');
		gl.uniform1f(u_threshold, params.threshold);

		const u_maskSize = gl.getUniformLocation(program, 'u_maskSize');
		gl.uniform1f(u_maskSize, params.maskSize);

		const u_black = gl.getUniformLocation(program, 'u_black');
		gl.uniform1i(u_black, params.black ? 1 : 0);
	},
});
