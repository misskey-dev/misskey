<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<canvas ref="canvasEl" style="width: 100%; height: 100%; pointer-events: none;"></canvas>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, shallowRef } from 'vue';
import isChromatic from 'chromatic/isChromatic';

const canvasEl = shallowRef<HTMLCanvasElement>();

const props = withDefaults(defineProps<{
	scale?: number;
	focus?: number;
}>(), {
	scale: 1.0,
	focus: 1.0,
});

function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = gl.createShader(type);
	if (shader == null) return null;

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(
			`falied to compile shader: ${gl.getShaderInfoLog(shader)}`,
		);
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

function initShaderProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

	const shaderProgram = gl.createProgram();
	if (shaderProgram == null || vertexShader == null || fragmentShader == null) return null;

	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert(
			`failed to init shader: ${gl.getProgramInfoLog(
				shaderProgram,
			)}`,
		);
		return null;
	}

	return shaderProgram;
}

let handle: ReturnType<typeof window['requestAnimationFrame']> | null = null;

onMounted(() => {
	const canvas = canvasEl.value!;
	let width = canvas.offsetWidth;
	let height = canvas.offsetHeight;
	canvas.width = width;
	canvas.height = height;

	const gl = canvas.getContext('webgl', { premultipliedAlpha: true });
	if (gl == null) return;

	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	const shaderProgram = initShaderProgram(gl, `
		attribute vec2 vertex;

		uniform vec2 u_scale;

		varying vec2 v_pos;

		void main() {
			gl_Position = vec4(vertex, 0.0, 1.0);
			v_pos = vertex / u_scale;
		}
	`, `
		precision mediump float;

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
			const vec4 C = vec4(0.211324865405187,
													0.366025403784439,
												-0.577350269189626,
													0.024390243902439);

			vec2 i  = floor(v + dot(v, C.yy) );
			vec2 x0 = v -   i + dot(i, C.xx);

			vec2 i1;
			i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
			vec4 x12 = x0.xyxy + C.xxzz;
			x12.xy -= i1;

			i = mod289(i);
			vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
				+ i.x + vec3(0.0, i1.x, 1.0 ));

			vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
			m = m*m ;
			m = m*m ;

			vec3 x = 2.0 * fract(p * C.www) - 1.0;
			vec3 h = abs(x) - 0.5;
			vec3 ox = floor(x + 0.5);
			vec3 a0 = x - ox;

			m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

			vec3 g;
			g.x  = a0.x  * x0.x  + h.x  * x0.y;
			g.yz = a0.yz * x12.xz + h.yz * x12.yw;
			return 130.0 * dot(m, g);
		}

		uniform float u_time;
		uniform vec2 u_resolution;
		uniform float u_spread;
		uniform float u_speed;
		uniform float u_warp;
		uniform float u_focus;
		uniform float u_itensity;

		varying vec2 v_pos;

		float circle( in vec2 _pos, in vec2 _origin, in float _radius ) {
			float SPREAD = 0.7 * u_spread;
			float SPEED = 0.00055 * u_speed;
			float WARP = 1.5 * u_warp;
			float FOCUS = 1.15 * u_focus;

			vec2 dist = _pos - _origin;

			float distortion = snoise( vec2(
				_pos.x * 1.587 * WARP + u_time * SPEED * 0.5,
				_pos.y * 1.192 * WARP + u_time * SPEED * 0.3
			) ) * 0.5 + 0.5;

			float feather = 0.01 + SPREAD * pow( distortion, FOCUS );

			return 1.0 - smoothstep(
				_radius - ( _radius * feather ),
				_radius + ( _radius * feather ),
				dot( dist, dist ) * 4.0
			);
		}

		void main() {
			vec3 green = vec3( 1.0 ) - vec3( 153.0 / 255.0, 211.0 / 255.0, 221.0 / 255.0 );
			vec3 purple = vec3( 1.0 ) - vec3( 195.0 / 255.0, 165.0 / 255.0, 242.0 / 255.0 );
			vec3 orange = vec3( 1.0 ) - vec3( 255.0 / 255.0, 156.0 / 255.0, 136.0 / 255.0 );

			float ratio = u_resolution.x / u_resolution.y;

			vec2 uv = vec2( v_pos.x, v_pos.y / ratio ) * 0.5 + 0.5;

			vec3 color = vec3( 0.0 );

			float greenMix = snoise( v_pos * 1.31 + u_time * 0.8 * 0.00017 ) * 0.5 + 0.5;
			float purpleMix = snoise( v_pos * 1.26 + u_time * 0.8 * -0.0001 ) * 0.5 + 0.5;
			float orangeMix = snoise( v_pos * 1.34 + u_time * 0.8 * 0.00015 ) * 0.5 + 0.5;

			float alphaOne = 0.35 + 0.65 * pow( snoise( vec2( u_time * 0.00012, uv.x ) ) * 0.5 + 0.5, 1.2 );
			float alphaTwo = 0.35 + 0.65 * pow( snoise( vec2( ( u_time + 1561.0 ) * 0.00014, uv.x ) ) * 0.5 + 0.5, 1.2 );
			float alphaThree = 0.35 + 0.65 * pow( snoise( vec2( ( u_time + 3917.0 ) * 0.00013, uv.x ) ) * 0.5 + 0.5, 1.2 );

			color += vec3( circle( uv, vec2( 0.22 + sin( u_time * 0.000201 ) * 0.06, 0.80 + cos( u_time * 0.000151 ) * 0.06 ), 0.15 ) ) * alphaOne * ( purple * purpleMix + orange * orangeMix );
			color += vec3( circle( uv, vec2( 0.90 + cos( u_time * 0.000166 ) * 0.06, 0.42 + sin( u_time * 0.000138 ) * 0.06 ), 0.18 ) ) * alphaTwo * ( green * greenMix + purple * purpleMix );
			color += vec3( circle( uv, vec2( 0.19 + sin( u_time * 0.000112 ) * 0.06, 0.25 + sin( u_time * 0.000192 ) * 0.06 ), 0.09 ) ) * alphaThree * ( orange * orangeMix );

			color *= u_itensity + 1.0 * pow( snoise( vec2( v_pos.y + u_time * 0.00013, v_pos.x + u_time * -0.00009 ) ) * 0.5 + 0.5, 2.0 );

			vec3 inverted = vec3( 1.0 ) - color;
			gl_FragColor = vec4( color, max(max(color.x, color.y), color.z) );
		}
	`);
	if (shaderProgram == null) return;

	gl.useProgram(shaderProgram);
	const u_resolution = gl.getUniformLocation(shaderProgram, 'u_resolution');
	const u_time = gl.getUniformLocation(shaderProgram, 'u_time');
	const u_spread = gl.getUniformLocation(shaderProgram, 'u_spread');
	const u_speed = gl.getUniformLocation(shaderProgram, 'u_speed');
	const u_warp = gl.getUniformLocation(shaderProgram, 'u_warp');
	const u_focus = gl.getUniformLocation(shaderProgram, 'u_focus');
	const u_itensity = gl.getUniformLocation(shaderProgram, 'u_itensity');
	const u_scale = gl.getUniformLocation(shaderProgram, 'u_scale');
	gl.uniform2fv(u_resolution, [canvas.width, canvas.height]);
	gl.uniform1f(u_spread, 1.0);
	gl.uniform1f(u_speed, 1.0);
	gl.uniform1f(u_warp, 1.0);
	gl.uniform1f(u_focus, props.focus);
	gl.uniform1f(u_itensity, 0.5);
	gl.uniform2fv(u_scale, [props.scale, props.scale]);

	const vertex = gl.getAttribLocation(shaderProgram, 'vertex');
	gl.enableVertexAttribArray(vertex);
	gl.vertexAttribPointer(vertex, 2, gl.FLOAT, false, 0, 0);

	const vertices = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

	if (isChromatic()) {
		gl!.uniform1f(u_time, 0);
		gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
	} else {
		function render(timeStamp: number) {
			let sizeChanged = false;
			if (Math.abs(height - canvas.offsetHeight) > 2) {
				height = canvas.offsetHeight;
				canvas.height = height;
				sizeChanged = true;
			}
			if (Math.abs(width - canvas.offsetWidth) > 2) {
				width = canvas.offsetWidth;
				canvas.width = width;
				sizeChanged = true;
			}
			if (sizeChanged && gl) {
				gl.uniform2fv(u_resolution, [width, height]);
				gl.viewport(0, 0, width, height);
			}

			gl!.uniform1f(u_time, timeStamp);
			gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);

			handle = window.requestAnimationFrame(render);
		}

		handle = window.requestAnimationFrame(render);
	}
});

onUnmounted(() => {
	if (handle) {
		window.cancelAnimationFrame(handle);
	}
});
</script>

<style lang="scss" module>
</style>
