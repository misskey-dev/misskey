/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

const shader = `#version 300 es
precision mediump float;

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform float u_radius;
uniform int u_samples;
out vec4 out_color;

void main() {
	vec2 texelSize = 1.0 / in_resolution;
	vec4 result = vec4(0.0);
	float totalSamples = 0.0;
	
	// Simple box blur with configurable sample count
	// Based on the original cross pattern but with more samples
	int samples = min(u_samples, 128);
	float radius = u_radius;
	
	// Calculate how many samples to take in each direction
	int sampleRadius = int(sqrt(float(samples)) / 2.0);
	
	// Sample in a grid pattern around the center
	for (int x = -sampleRadius; x <= sampleRadius; x++) {
		for (int y = -sampleRadius; y <= sampleRadius; y++) {
			vec2 offset = vec2(float(x), float(y)) * texelSize * radius;
			vec2 sampleUV = in_uv + offset;
			
			// Only sample if within texture bounds
			if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
				result += texture(in_texture, sampleUV);
				totalSamples += 1.0;
			}
		}
	}
	
	out_color = totalSamples > 0.0 ? result / totalSamples : texture(in_texture, in_uv);
}
`;

export const FX_blur = defineImageEffectorFx({
	id: 'blur',
	name: i18n.ts._imageEffector._fxs.blur,
	shader,
	uniforms: ['radius', 'samples'] as const,
	params: {
		radius: {
			label: i18n.ts._imageEffector._fxProps.radius,
			type: 'number',
			default: 3.0,
			min: 0.0,
			max: 15.0,
			step: 0.5,
		},
		samples: {
			label: i18n.ts._imageEffector._fxProps.samples,
			type: 'number',
			default: 64,
			min: 9,
			max: 128,
			step: 1,
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.radius, params.radius);
		gl.uniform1i(u.samples, params.samples);
	},
});