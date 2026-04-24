#version 300 es

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

in vec2 position;
uniform vec2 u_scale;
out vec2 in_uv;

void main() {
	gl_Position = vec4(position, 0.0, 1.0);
	in_uv = position / u_scale;
}
