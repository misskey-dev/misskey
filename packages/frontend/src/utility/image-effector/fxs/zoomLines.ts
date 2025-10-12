/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { GLSL_LIB_SNOISE } from '@/utility/webgl.js';
import { i18n } from '@/i18n.js';

const shader = `#version 300 es
precision mediump float;

${GLSL_LIB_SNOISE}

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform vec2 u_pos;
uniform float u_frequency;
uniform bool u_thresholdEnabled;
uniform float u_threshold;
uniform float u_maskSize;
uniform bool u_black;
out vec4 out_color;

void main() {
	vec4 in_color = texture(in_texture, in_uv);
	vec2 centeredUv = (in_uv - vec2(0.5, 0.5));
	vec2 uv = centeredUv;

	float seed = 1.0;
	float time = 0.0;

	vec2 noiseUV = (uv - u_pos) / distance((uv - u_pos), vec2(0.0));
	float noiseX = (noiseUV.x + seed) * u_frequency;
	float noiseY = (noiseUV.y + seed) * u_frequency;
  float noise = (1.0 + snoise(vec3(noiseX, noiseY, time))) / 2.0;

	float t = noise;
	if (u_thresholdEnabled) t = t < u_threshold ? 1.0 : 0.0;

	// TODO: マスクの形自体も揺らぎを与える
	float d = distance(uv * vec2(2.0, 2.0), u_pos * vec2(2.0, 2.0));
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
	id: 'zoomLines',
	name: i18n.ts._imageEffector._fxs.zoomLines,
	shader,
	uniforms: ['pos', 'frequency', 'thresholdEnabled', 'threshold', 'maskSize', 'black'] as const,
	params: {
		x: {
			label: i18n.ts._imageEffector._fxProps.centerX,
			type: 'number',
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
		},
		y: {
			label: i18n.ts._imageEffector._fxProps.centerY,
			type: 'number',
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
		},
		frequency: {
			label: i18n.ts._imageEffector._fxProps.frequency,
			type: 'number',
			default: 5.0,
			min: 0.0,
			max: 15.0,
			step: 0.1,
		},
		smoothing: {
			label: i18n.ts._imageEffector._fxProps.zoomLinesSmoothing,
			caption: i18n.ts._imageEffector._fxProps.zoomLinesSmoothingDescription,
			type: 'boolean',
			default: false,
		},
		threshold: {
			label: i18n.ts._imageEffector._fxProps.zoomLinesThreshold,
			type: 'number',
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		maskSize: {
			label: i18n.ts._imageEffector._fxProps.zoomLinesMaskSize,
			type: 'number',
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		black: {
			label: i18n.ts._imageEffector._fxProps.zoomLinesBlack,
			type: 'boolean',
			default: false,
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform2f(u.pos, params.x / 2, params.y / 2);
		gl.uniform1f(u.frequency, params.frequency * params.frequency);
		// thresholdの調整が有効な間はsmoothingが利用できない
		gl.uniform1i(u.thresholdEnabled, params.smoothing ? 0 : 1);
		gl.uniform1f(u.threshold, params.threshold);
		gl.uniform1f(u.maskSize, params.maskSize);
		gl.uniform1i(u.black, params.black ? 1 : 0);
	},
});
