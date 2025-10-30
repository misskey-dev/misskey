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

float remap(float value, float inputMin, float inputMax, float outputMin, float outputMax) {
	return outputMin + (outputMax - outputMin) * ((value - inputMin) / (inputMax - inputMin));
}

void main() {
	float labelRatio = u_labelEnabled ? (u_labelResolution.y / in_resolution.y) : 0.0;

	vec4 image_color = texture(u_image, vec2(
		remap(in_uv.x, u_imageMarginX, 1.0 - u_imageMarginX, 0.0, 1.0),
		remap(in_uv.y, u_imageMarginY, 1.0 - labelRatio, 0.0, 1.0)
	));

	vec4 label_color = texture(u_label, (in_uv - vec2(0.0, 1.0 - labelRatio)) / vec2(1.0, labelRatio));

	if (in_uv.y > (1.0 - labelRatio)) {
		out_color = label_color;
	} else {
		if (in_uv.y > u_imageMarginY && in_uv.x > u_imageMarginX && in_uv.x < (1.0 - u_imageMarginX)) {
			out_color = image_color;
		} else {
			out_color = vec4(1.0, 1.0, 1.0, 1.0);
		}
	}
}
