#version 300 es
precision mediump float;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

in vec4 v_color;
in float v_rotation;
uniform sampler2D u_texture;
out vec4 out_color;

void main() {
	vec2 rotated = vec2(
		cos(v_rotation) * (gl_PointCoord.x - 0.5) + sin(v_rotation) * (gl_PointCoord.y - 0.5) + 0.5,
		cos(v_rotation) * (gl_PointCoord.y - 0.5) - sin(v_rotation) * (gl_PointCoord.x - 0.5) + 0.5
	);

	vec4 snowflake = texture(u_texture, rotated);

	out_color = vec4(snowflake.rgb * v_color.xyz, snowflake.a * v_color.a);
}
