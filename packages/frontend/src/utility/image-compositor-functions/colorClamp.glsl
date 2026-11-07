#version 300 es
precision mediump float;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// colorClamp, colorClampAdvanced共通
// colorClampではmax, minがすべて同じ値となる

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform float u_rMax;
uniform float u_rMin;
uniform float u_gMax;
uniform float u_gMin;
uniform float u_bMax;
uniform float u_bMin;
out vec4 out_color;

void main() {
	vec4 in_color = texture(in_texture, in_uv);
	float r = min(max(in_color.r, u_rMin), u_rMax);
	float g = min(max(in_color.g, u_gMin), u_gMax);
	float b = min(max(in_color.b, u_bMin), u_bMax);
	out_color = vec4(r, g, b, in_color.a);
}
