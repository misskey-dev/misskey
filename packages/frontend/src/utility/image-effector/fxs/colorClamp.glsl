/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

#version 300 es
precision mediump float;

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform float u_max;
uniform float u_min;
out vec4 out_color;

void main() {
	vec4 in_color = texture(in_texture, in_uv);
	float r = min(max(in_color.r, u_min), u_max);
	float g = min(max(in_color.g, u_min), u_max);
	float b = min(max(in_color.b, u_min), u_max);
	out_color = vec4(r, g, b, in_color.a);
}
