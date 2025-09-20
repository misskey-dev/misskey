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
	float totalWeight = 0.0;
	
	// High-quality blur with configurable sample count
	int samples = min(u_samples, 128); // Clamp to reasonable maximum
	int radius = int(u_radius);
	
	// Use a more sophisticated sampling pattern for better quality
	for (int x = -radius; x <= radius; x++) {
		for (int y = -radius; y <= radius; y++) {
			// Calculate distance from center for weighting
			float distance = length(vec2(float(x), float(y)));
			
			// Skip samples beyond the circular radius
			if (distance > u_radius) continue;
			
			// Calculate sample position
			vec2 offset = vec2(float(x), float(y)) * texelSize;
			vec2 sampleUV = in_uv + offset;
			
			// Only sample if within texture bounds
			if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
				// Use Gaussian-like weighting for better quality
				float weight = exp(-(distance * distance) / (2.0 * (u_radius * 0.5) * (u_radius * 0.5)));
				result += texture(in_texture, sampleUV) * weight;
				totalWeight += weight;
				
				// Limit actual samples processed for performance
				samples--;
				if (samples <= 0) break;
			}
		}
		if (samples <= 0) break;
	}
	
	out_color = totalWeight > 0.0 ? result / totalWeight : texture(in_texture, in_uv);
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