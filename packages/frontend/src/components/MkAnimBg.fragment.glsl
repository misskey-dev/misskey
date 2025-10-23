#version 300 es
precision mediump float;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

vec3 mod289(vec3 x) {
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
	return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v) {
	const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);

	vec2 i  = floor(v + dot(v, C.yy));
	vec2 x0 = v - i + dot(i, C.xx);

	vec2 i1;
	i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
	vec4 x12 = x0.xyxy + C.xxzz;
	x12.xy -= i1;

	i = mod289(i);
	vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

	vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
	m = m*m;
	m = m*m;

	vec3 x = 2.0 * fract(p * C.www) - 1.0;
	vec3 h = abs(x) - 0.5;
	vec3 ox = floor(x + 0.5);
	vec3 a0 = x - ox;

	m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

	vec3 g;
	g.x = a0.x * x0.x + h.x * x0.y;
	g.yz = a0.yz * x12.xz + h.yz * x12.yw;
	return 130.0 * dot(m, g);
}

in vec2 in_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_spread;
uniform float u_speed;
uniform float u_warp;
uniform float u_focus;
uniform float u_itensity;
out vec4 out_color;

float circle(in vec2 _pos, in vec2 _origin, in float _radius) {
	float SPREAD = 0.7 * u_spread;
	float SPEED = 0.00055 * u_speed;
	float WARP = 1.5 * u_warp;
	float FOCUS = 1.15 * u_focus;

	vec2 dist = _pos - _origin;

	float distortion = snoise(vec2(
		_pos.x * 1.587 * WARP + u_time * SPEED * 0.5,
		_pos.y * 1.192 * WARP + u_time * SPEED * 0.3
	)) * 0.5 + 0.5;

	float feather = 0.01 + SPREAD * pow(distortion, FOCUS);

	return 1.0 - smoothstep(
		_radius - (_radius * feather),
		_radius + (_radius * feather),
		dot( dist, dist ) * 4.0
	);
}

void main() {
	vec3 green = vec3(1.0) - vec3(153.0 / 255.0, 211.0 / 255.0, 221.0 / 255.0);
	vec3 purple = vec3(1.0) - vec3(195.0 / 255.0, 165.0 / 255.0, 242.0 / 255.0);
	vec3 orange = vec3(1.0) - vec3(255.0 / 255.0, 156.0 / 255.0, 136.0 / 255.0);

	float ratio = u_resolution.x / u_resolution.y;

	vec2 uv = vec2(in_uv.x, in_uv.y / ratio) * 0.5 + 0.5;

	vec3 color = vec3(0.0);

	float greenMix = snoise(in_uv * 1.31 + u_time * 0.8 * 0.00017) * 0.5 + 0.5;
	float purpleMix = snoise(in_uv * 1.26 + u_time * 0.8 * -0.0001) * 0.5 + 0.5;
	float orangeMix = snoise(in_uv * 1.34 + u_time * 0.8 * 0.00015) * 0.5 + 0.5;

	float alphaOne = 0.35 + 0.65 * pow(snoise(vec2(u_time * 0.00012, uv.x)) * 0.5 + 0.5, 1.2);
	float alphaTwo = 0.35 + 0.65 * pow(snoise(vec2((u_time + 1561.0) * 0.00014, uv.x )) * 0.5 + 0.5, 1.2);
	float alphaThree = 0.35 + 0.65 * pow(snoise(vec2((u_time + 3917.0) * 0.00013, uv.x )) * 0.5 + 0.5, 1.2);

	color += vec3(circle(uv, vec2(0.22 + sin(u_time * 0.000201) * 0.06, 0.80 + cos(u_time * 0.000151) * 0.06), 0.15)) * alphaOne * (purple * purpleMix + orange * orangeMix);
	color += vec3(circle(uv, vec2(0.90 + cos(u_time * 0.000166) * 0.06, 0.42 + sin(u_time * 0.000138) * 0.06), 0.18)) * alphaTwo * (green * greenMix + purple * purpleMix);
	color += vec3(circle(uv, vec2(0.19 + sin(u_time * 0.000112) * 0.06, 0.25 + sin(u_time * 0.000192) * 0.06), 0.09)) * alphaThree * (orange * orangeMix);

	color *= u_itensity + 1.0 * pow(snoise(vec2(in_uv.y + u_time * 0.00013, in_uv.x + u_time * -0.00009)) * 0.5 + 0.5, 2.0);

	vec3 inverted = vec3(1.0) - color;
	out_color = vec4(color, max(max(color.x, color.y), color.z));
}
