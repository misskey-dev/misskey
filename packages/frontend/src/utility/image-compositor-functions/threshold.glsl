#version 300 es
precision mediump float;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform float u_r;
uniform float u_g;
uniform float u_b;
out vec4 out_color;

void main() {
	vec4 in_color = texture(in_texture, in_uv);
	float r = in_color.r < u_r ? 0.0 : 1.0;
	float g = in_color.g < u_g ? 0.0 : 1.0;
	float b = in_color.b < u_b ? 0.0 : 1.0;
	out_color = vec4(r, g, b, in_color.a);
}
