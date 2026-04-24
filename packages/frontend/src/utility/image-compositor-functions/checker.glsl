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
uniform vec3 u_color;
uniform float u_opacity;
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

	float fmodResult = mod(floor(u_scale * rotatedUV.x) + floor(u_scale * rotatedUV.y), 2.0);
	float fin = max(sign(fmodResult), 0.0);

	out_color = vec4(
		mix(in_color.r, u_color.r, fin * u_opacity),
		mix(in_color.g, u_color.g, fin * u_opacity),
		mix(in_color.b, u_color.b, fin * u_opacity),
		in_color.a
	);
}
