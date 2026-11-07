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
uniform float u_phase;
uniform float u_frequency;
uniform float u_strength;
uniform int u_direction; // 0: vertical, 1: horizontal
out vec4 out_color;

void main() {
	float v = u_direction == 0 ?
		sin((HALF_PI + (u_phase * PI) - (u_frequency / 2.0)) + in_uv.y * u_frequency) * u_strength :
		sin((HALF_PI + (u_phase * PI) - (u_frequency / 2.0)) + in_uv.x * u_frequency) * u_strength;
	vec4 in_color = u_direction == 0 ?
		texture(in_texture, vec2(in_uv.x + v, in_uv.y)) :
		texture(in_texture, vec2(in_uv.x, in_uv.y + v));
	out_color = in_color;
}
