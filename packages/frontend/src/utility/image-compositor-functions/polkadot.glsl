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
uniform float u_angle;
uniform float u_scale;
uniform float u_major_radius;
uniform float u_major_opacity;
uniform float u_minor_divisions;
uniform float u_minor_radius;
uniform float u_minor_opacity;
uniform vec3 u_color;
out vec4 out_color;

void main() {
	vec4 in_color = texture(in_texture, in_uv);
	float x_ratio = max(in_resolution.x / in_resolution.y, 1.0);
	float y_ratio = max(in_resolution.y / in_resolution.x, 1.0);

	float angle = -(u_angle * PI);
	vec2 centeredUv = (in_uv - vec2(0.5, 0.5)) * vec2(x_ratio, y_ratio);
	vec2 rotatedUV = vec2(
		centeredUv.x * cos(angle) - centeredUv.y * sin(angle),
		centeredUv.x * sin(angle) + centeredUv.y * cos(angle)
	);

	float major_modX = mod(rotatedUV.x, (1.0 / u_scale));
	float major_modY = mod(rotatedUV.y, (1.0 / u_scale));
	float major_threshold = ((u_major_radius / 2.0) / u_scale);
	if (
		length(vec2(major_modX, major_modY)) < major_threshold ||
		length(vec2((1.0 / u_scale) - major_modX, major_modY)) < major_threshold ||
		length(vec2(major_modX, (1.0 / u_scale) - major_modY)) < major_threshold ||
		length(vec2((1.0 / u_scale) - major_modX, (1.0 / u_scale) - major_modY)) < major_threshold
	) {
		out_color = vec4(
			mix(in_color.r, u_color.r, u_major_opacity),
			mix(in_color.g, u_color.g, u_major_opacity),
			mix(in_color.b, u_color.b, u_major_opacity),
			in_color.a
		);
		return;
	}

	float minor_modX = mod(rotatedUV.x, (1.0 / u_scale / u_minor_divisions));
	float minor_modY = mod(rotatedUV.y, (1.0 / u_scale / u_minor_divisions));
	float minor_threshold = ((u_minor_radius / 2.0) / (u_minor_divisions * u_scale));
	if (
		length(vec2(minor_modX, minor_modY)) < minor_threshold ||
		length(vec2((1.0 / u_scale / u_minor_divisions) - minor_modX, minor_modY)) < minor_threshold ||
		length(vec2(minor_modX, (1.0 / u_scale / u_minor_divisions) - minor_modY)) < minor_threshold ||
		length(vec2((1.0 / u_scale / u_minor_divisions) - minor_modX, (1.0 / u_scale / u_minor_divisions) - minor_modY)) < minor_threshold
	) {
		out_color = vec4(
			mix(in_color.r, u_color.r, u_minor_opacity),
			mix(in_color.g, u_color.g, u_minor_opacity),
			mix(in_color.b, u_color.b, u_minor_opacity),
			in_color.a
		);
		return;
	}

	out_color = in_color;
}
