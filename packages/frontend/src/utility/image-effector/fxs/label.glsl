#version 300 es
precision mediump float;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform sampler2D u_image;
uniform sampler2D u_label;
uniform vec2 u_labelResolution;
uniform bool u_labelEnabled;
uniform float u_imageMarginX;
uniform float u_imageMarginY;
out vec4 out_color;

void main() {
	float labelRatio = u_labelEnabled ? (u_labelResolution.y / in_resolution.y) : 0.0;
	vec4 image_color = texture(u_image, (in_uv / vec2(1.0, 1.0 - labelRatio) / vec2(1.0 - u_imageMarginX - u_imageMarginX, 1.0 - u_imageMarginY)) - vec2(u_imageMarginX, u_imageMarginY));
	vec4 label_color = texture(u_label, (in_uv - vec2(0.0, 1.0 - labelRatio)) / vec2(1.0, labelRatio));
	if (in_uv.y > (1.0 - labelRatio)) {
		out_color = label_color;
	} else {
		if (in_uv.x < u_imageMarginX || in_uv.x > (1.0 - u_imageMarginX) || in_uv.y < u_imageMarginY) {
			out_color = vec4(1.0, 1.0, 1.0, 1.0);
		} else {
			out_color = image_color;
		}
	}
}
