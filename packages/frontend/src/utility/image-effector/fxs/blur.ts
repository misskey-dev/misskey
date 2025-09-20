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
	vec4 result = vec4(0.0);
	float totalSamples = 0.0;

	// Make blur radius resolution-independent by using a percentage of image size
	// This ensures consistent visual blur regardless of image resolution
	float referenceSize = min(in_resolution.x, in_resolution.y);
	float normalizedRadius = u_radius / 100.0; // Convert radius to percentage (0-15 -> 0-0.15)
	vec2 blurOffset = vec2(normalizedRadius) / in_resolution * referenceSize;

	// Calculate how many samples to take in each direction
	// This determines the grid density, not the blur extent
	int sampleRadius = int(sqrt(float(u_samples)) / 2.0);

	// Sample in a grid pattern within the specified radius
	for (int x = -sampleRadius; x <= sampleRadius; x++) {
		for (int y = -sampleRadius; y <= sampleRadius; y++) {
			// Normalize the grid position to [-1, 1] range
			float normalizedX = float(x) / float(sampleRadius);
			float normalizedY = float(y) / float(sampleRadius);

			// Scale by radius to get the actual sampling offset
			vec2 offset = vec2(normalizedX, normalizedY) * blurOffset;
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
			label: i18n.ts._imageEffector._fxProps.strength,
			type: 'number',
			default: 3.0,
			min: 0.0,
			max: 20.0,
			step: 0.5,
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.radius, params.radius);
		gl.uniform1i(u.samples, 256);
	},
});
