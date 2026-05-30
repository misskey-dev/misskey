#version 300 es
precision mediump float;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const float PI = 3.141592653589793;
const float TWO_PI = 6.283185307179586;
const float HALF_PI = 1.5707963267948966;

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform vec2 u_offset;
uniform vec2 u_scale;
uniform bool u_ellipse;
uniform float u_angle;
uniform int u_samples;
uniform float u_strength;
out vec4 out_color;


void main() {
	if (u_strength <= 0.0) {
		out_color = texture(in_texture, in_uv);
		return;
	}

	float angle = -(u_angle * PI);
	float aspect = in_resolution.x / max(in_resolution.y, 1.0);
	vec2 centeredUv = in_uv - vec2(0.5, 0.5) - u_offset;
	vec2 scaledUv = vec2(centeredUv.x * aspect, centeredUv.y);
	vec2 rotatedScaledUv = vec2(
		scaledUv.x * cos(angle) - scaledUv.y * sin(angle),
		scaledUv.x * sin(angle) + scaledUv.y * cos(angle)
	);
	vec2 rotatedUV = vec2(rotatedScaledUv.x / aspect, rotatedScaledUv.y) + u_offset;

	bool isInside = false;
	if (u_ellipse) {
		vec2 norm = (rotatedUV - u_offset) / u_scale;
		isInside = dot(norm, norm) <= 1.0;
	} else {
		isInside = rotatedUV.x > u_offset.x - u_scale.x && rotatedUV.x < u_offset.x + u_scale.x && rotatedUV.y > u_offset.y - u_scale.y && rotatedUV.y < u_offset.y + u_scale.y;
	}

	if (!isInside) {
		out_color = texture(in_texture, in_uv);
		return;
	}

	float baseResolution = (in_resolution.x + in_resolution.y) * 0.5;
	float dx = (u_strength * baseResolution) / max(in_resolution.x, 1.0);
	float dy = (u_strength * baseResolution) / max(in_resolution.y, 1.0);
	vec2 centerUv = vec2(0.5, 0.5) + u_offset;
	vec2 new_uv = vec2(
		(dx * (floor((in_uv.x - centerUv.x - (dx / 2.0)) / dx) + 0.5)),
		(dy * (floor((in_uv.y - centerUv.y - (dy / 2.0)) / dy) + 0.5))
	) + vec2(centerUv.x + (dx / 2.0), centerUv.y + (dy / 2.0));

	vec4 result = vec4(0.0);
	float totalSamples = 0.0;

	vec2 halfStep = vec2(dx, dy) * 0.25;
	result += texture(in_texture, new_uv + vec2(-halfStep.x, -halfStep.y));
	result += texture(in_texture, new_uv + vec2(halfStep.x, -halfStep.y));
	result += texture(in_texture, new_uv + vec2(-halfStep.x, halfStep.y));
	result += texture(in_texture, new_uv + vec2(halfStep.x, halfStep.y));
	totalSamples += 4.0;

	out_color = totalSamples > 0.0 ? result / totalSamples : texture(in_texture, in_uv);
}
