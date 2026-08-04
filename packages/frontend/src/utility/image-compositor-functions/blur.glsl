#version 300 es
precision mediump float;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const float PI = 3.141592653589793;
const float TWO_PI = 6.283185307179586;
const float HALF_PI = 1.5707963267948966;

const float goldenAngle = 2.39996323;
const int sampleCount = 256;
const float sampleCountF = float(sampleCount);

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform vec2 u_offset;
uniform vec2 u_scale;
uniform bool u_ellipse;
uniform float u_angle;
uniform float u_radius;
out vec4 out_color;

float rand(vec2 value) {
	return fract(sin(dot(value, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
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

	vec4 result = vec4(0.0);
	float totalSamples = 0.0;
	float jitter = rand(in_uv);

	// Sample in a circular pattern to avoid axis-aligned artifacts
	for (int i = 0; i < sampleCount; i++) {
		float fi = float(i);
		float radius = sqrt((fi + 0.5) / sampleCountF);
		float theta = (fi + jitter) * goldenAngle;
		vec2 direction = vec2(cos(theta), sin(theta));
		vec2 offset = direction * (u_radius * radius);
		float weight = exp(-radius * radius * 4.0);
		result += texture(in_texture, in_uv + offset) * weight;
		totalSamples += weight;
	}

	out_color = result / totalSamples;
}
