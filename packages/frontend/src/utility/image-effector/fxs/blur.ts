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
out vec4 out_color;

void main() {
	vec2 texelSize = 1.0 / in_resolution;
	vec4 result = vec4(0.0);
	
	// Simple box blur with fixed kernel size for better performance
	// This avoids dynamic loops which can be slow on some GPUs
	float radius = min(u_radius, 8.0); // Clamp to reasonable maximum
	
	// Sample in a cross pattern for efficiency
	result += texture(in_texture, in_uv); // Center
	
	// Horizontal samples
	result += texture(in_texture, in_uv + vec2(-radius * texelSize.x, 0.0));
	result += texture(in_texture, in_uv + vec2(radius * texelSize.x, 0.0));
	
	// Vertical samples  
	result += texture(in_texture, in_uv + vec2(0.0, -radius * texelSize.y));
	result += texture(in_texture, in_uv + vec2(0.0, radius * texelSize.y));
	
	// Diagonal samples for better quality
	result += texture(in_texture, in_uv + vec2(-radius * texelSize.x, -radius * texelSize.y));
	result += texture(in_texture, in_uv + vec2(radius * texelSize.x, -radius * texelSize.y));
	result += texture(in_texture, in_uv + vec2(-radius * texelSize.x, radius * texelSize.y));
	result += texture(in_texture, in_uv + vec2(radius * texelSize.x, radius * texelSize.y));
	
	// Average the samples
	out_color = result / 9.0;
}
`;

export const FX_blur = defineImageEffectorFx({
	id: 'blur',
	name: i18n.ts._imageEffector._fxs.blur,
	shader,
	uniforms: ['radius'] as const,
	params: {
		radius: {
			label: i18n.ts._imageEffector._fxProps.radius,
			type: 'number',
			default: 3.0,
			min: 0.0,
			max: 10.0,
			step: 0.5,
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.radius, params.radius);
	},
});