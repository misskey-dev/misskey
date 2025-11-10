#version 300 es
precision mediump float;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform bool u_r;
uniform bool u_g;
uniform bool u_b;
out vec4 out_color;

void main() {
	vec4 in_color = texture(in_texture, in_uv);
	out_color.r = u_r ? 1.0 - in_color.r : in_color.r;
	out_color.g = u_g ? 1.0 - in_color.g : in_color.g;
	out_color.b = u_b ? 1.0 - in_color.b : in_color.b;
	out_color.a = in_color.a;
}
