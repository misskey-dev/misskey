#version 300 es

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

in vec4 a_position;
in vec4 a_color;
in vec3 a_rotation;
in vec3 a_speed;
in float a_size;
out vec4 v_color;
out float v_rotation;
uniform float u_time;
uniform mat4 u_projection;
uniform vec3 u_worldSize;
uniform float u_gravity;
uniform float u_wind;
uniform float u_spin_factor;
uniform float u_turbulence;

void main() {
	v_color = a_color;
	v_rotation = a_rotation.x + (u_time * u_spin_factor) * a_rotation.y;

	vec3 pos = a_position.xyz;

	pos.x = mod(pos.x + u_time + u_wind * a_speed.x, u_worldSize.x * 2.0) - u_worldSize.x;
	pos.y = mod(pos.y - u_time * a_speed.y * u_gravity, u_worldSize.y * 2.0) - u_worldSize.y;

	pos.x += sin(u_time * a_speed.z * u_turbulence) * a_rotation.z;
	pos.z += cos(u_time * a_speed.z * u_turbulence) * a_rotation.z;

	gl_Position = u_projection * vec4(pos.xyz, a_position.w);
	gl_PointSize = (a_size / gl_Position.w) * 100.0;
}
