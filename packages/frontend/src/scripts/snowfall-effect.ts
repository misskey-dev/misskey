/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SnowfallEffect {
	private VERTEX_SOURCE = `#version 300 es
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

		void main() {
			v_color = a_color;
			v_rotation = a_rotation.x + u_time * a_rotation.y;

			vec3 pos = a_position.xyz;

			float turbulence = 1.0;

			pos.x = mod(pos.x + u_time + u_wind * a_speed.x, u_worldSize.x * 2.0) - u_worldSize.x;
			pos.y = mod(pos.y - u_time * a_speed.y * u_gravity, u_worldSize.y * 2.0) - u_worldSize.y;

			pos.x += sin(u_time * a_speed.z * turbulence) * a_rotation.z;
			pos.z += cos(u_time * a_speed.z * turbulence) * a_rotation.z;

			gl_Position = u_projection * vec4(pos.xyz, a_position.w);
			gl_PointSize = (a_size / gl_Position.w) * 100.0;
		}
	`;

	private FRAGMENT_SOURCE = `#version 300 es
		precision highp float;

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
	`;

	private gl: WebGLRenderingContext;
	private program: WebGLProgram;
	private canvas: HTMLCanvasElement;
	private buffers: Record<string, {
		size: number;
		value: number[] | Float32Array;
		location: number;
		ref: WebGLBuffer;
	}>;
	private uniforms: Record<string, {
		type: string;
		value: number[] | Float32Array;
		location: WebGLUniformLocation;
	}>;
	private texture: WebGLTexture;
	private camera: {
		fov: number;
		near: number;
		far: number;
		aspect: number;
		z: number;
	};
	private wind: {
		current: number;
		force: number;
		target: number;
		min: number;
		max: number;
		easing: number;
	};
	private time: {
		start: number;
		previous: number;
	} = {
			start: 0,
			previous: 0,
		};
	private raf = 0;

	private density: number = 1 / 90;
	private depth = 100;
	private count = 1000;
	private gravity = 100;
	private speed: number = 1 / 10000;
	private color: number[] = [1, 1, 1];
	private opacity = 1;
	private size = 4;
	private snowflake = 'data:image/png;base64,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';

	private INITIAL_BUFFERS = () => ({
		position: { size: 3, value: [] },
		color: { size: 4, value: [] },
		size: { size: 1, value: [] },
		rotation: { size: 3, value: [] },
		speed: { size: 3, value: [] },
	});

	private INITIAL_UNIFORMS = () => ({
		time: { type: 'float', value: 0 },
		worldSize: { type: 'vec3', value: [0, 0, 0] },
		gravity: { type: 'float', value: this.gravity },
		wind: { type: 'float', value: 0 },
		projection: {
			type: 'mat4',
			value: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
		},
	});

	private UNIFORM_SETTERS = {
		int: 'uniform1i',
		float: 'uniform1f',
		vec2: 'uniform2fv',
		vec3: 'uniform3fv',
		vec4: 'uniform4fv',
		mat2: 'uniformMatrix2fv',
		mat3: 'uniformMatrix3fv',
		mat4: 'uniformMatrix4fv',
	};

	private CAMERA = {
		fov: 60,
		near: 5,
		far: 10000,
		aspect: 1,
		z: 100,
	};

	private WIND = {
		current: 0,
		force: 0.01,
		target: 0.01,
		min: 0,
		max: 0.125,
		easing: 0.0005,
	};

	constructor() {
		const canvas = this.initCanvas();
		const gl = canvas.getContext('webgl2', { antialias: true });
		if (gl == null) throw new Error('Failed to get WebGL context');

		document.body.append(canvas);

		this.canvas = canvas;
		this.gl = gl;
		this.program = this.initProgram();
		this.buffers = this.initBuffers();
		this.uniforms = this.initUniforms();
		this.texture = this.initTexture();
		this.camera = this.initCamera();
		this.wind = this.initWind();

		this.resize = this.resize.bind(this);
		this.update = this.update.bind(this);

		window.addEventListener('resize', () => this.resize());
	}

	private initCanvas(): HTMLCanvasElement {
		const canvas = document.createElement('canvas');

		Object.assign(canvas.style, {
			position: 'fixed',
			top: 0,
			left: 0,
			width: '100vw',
			height: '100vh',
			background: 'transparent',
			'pointer-events': 'none',
			'z-index': 2147483647,
		});

		return canvas;
	}

	private initCamera() {
		return { ...this.CAMERA };
	}

	private initWind() {
		return { ...this.WIND };
	}

	private initShader(type, source): WebGLShader {
		const { gl } = this;
		const shader = gl.createShader(type);
		if (shader == null) throw new Error('Failed to create shader');

		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		return shader;
	}

	private initProgram(): WebGLProgram {
		const { gl } = this;
		const vertex = this.initShader(gl.VERTEX_SHADER, this.VERTEX_SOURCE);
		const fragment = this.initShader(gl.FRAGMENT_SHADER, this.FRAGMENT_SOURCE);
		const program = gl.createProgram();
		if (program == null) throw new Error('Failed to create program');

		gl.attachShader(program, vertex);
		gl.attachShader(program, fragment);
		gl.linkProgram(program);
		gl.useProgram(program);

		return program;
	}

	private initBuffers(): SnowfallEffect['buffers'] {
		const { gl, program } = this;
		const buffers = this.INITIAL_BUFFERS() as unknown as SnowfallEffect['buffers'];

		for (const [name, buffer] of Object.entries(buffers)) {
			buffer.location = gl.getAttribLocation(program, `a_${name}`);
			buffer.ref = gl.createBuffer()!;

			gl.bindBuffer(gl.ARRAY_BUFFER, buffer.ref);
			gl.enableVertexAttribArray(buffer.location);
			gl.vertexAttribPointer(
				buffer.location,
				buffer.size,
				gl.FLOAT,
				false,
				0,
				0,
			);
		}

		return buffers;
	}

	private updateBuffers() {
		const { buffers } = this;

		for (const name of Object.keys(buffers)) {
			this.setBuffer(name);
		}
	}

	private setBuffer(name: string, value?) {
		const { gl, buffers } = this;
		const buffer = buffers[name];

		buffer.value = new Float32Array(value ?? buffer.value);

		gl.bindBuffer(gl.ARRAY_BUFFER, buffer.ref);
		gl.bufferData(gl.ARRAY_BUFFER, buffer.value, gl.STATIC_DRAW);
	}

	private initUniforms(): SnowfallEffect['uniforms'] {
		const { gl, program } = this;
		const uniforms = this.INITIAL_UNIFORMS() as unknown as SnowfallEffect['uniforms'];

		for (const [name, uniform] of Object.entries(uniforms)) {
			uniform.location = gl.getUniformLocation(program, `u_${name}`)!;
		}

		return uniforms;
	}

	private updateUniforms() {
		const { uniforms } = this;

		for (const name of Object.keys(uniforms)) {
			this.setUniform(name);
		}
	}

	private setUniform(name: string, value?) {
		const { gl, uniforms } = this;
		const uniform = uniforms[name];
		const setter = this.UNIFORM_SETTERS[uniform.type];
		const isMatrix = /^mat[2-4]$/i.test(uniform.type);

		uniform.value = value ?? uniform.value;

		if (isMatrix) {
			gl[setter](uniform.location, false, uniform.value);
		} else {
			gl[setter](uniform.location, uniform.value);
		}
	}

	private initTexture() {
		const { gl } = this;
		const texture = gl.createTexture();
		if (texture == null) throw new Error('Failed to create texture');
		const image = new Image();

		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			1,
			1,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			new Uint8Array([0, 0, 0, 0]),
		);

		image.onload = () => {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				image,
			);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		};

		image.src = this.snowflake;

		return texture;
	}

	private initSnowflakes(vw: number, vh: number, dpi: number) {
		const position: number[] = [];
		const color: number[] = [];
		const size: number[] = [];
		const rotation: number[] = [];
		const speed: number[] = [];

		const height = 1 / this.density;
		const width = (vw / vh) * height;
		const depth = this.depth;
		const count = this.count;
		const length = (vw / vh) * count;

		for (let i = 0; i < length; ++i) {
			position.push(
				-width + Math.random() * width * 2,
				-height + Math.random() * height * 2,
				Math.random() * depth * 2,
			);

			speed.push(1 + Math.random(), 1 + Math.random(), Math.random() * 10);

			rotation.push(
				Math.random() * 2 * Math.PI,
				Math.random() * 20,
				Math.random() * 10,
			);

			color.push(...this.color, 0.1 + Math.random() * this.opacity);
			//size.push((this.size * Math.random() * this.size * vh * dpi) / 1000);
			size.push((this.size * vh * dpi) / 1000);
		}

		this.setUniform('worldSize', [width, height, depth]);

		this.setBuffer('position', position);
		this.setBuffer('color', color);
		this.setBuffer('rotation', rotation);
		this.setBuffer('size', size);
		this.setBuffer('speed', speed);
	}

	private setProjection(aspect: number) {
		const { camera } = this;

		camera.aspect = aspect;

		const fovRad = (camera.fov * Math.PI) / 180;
		const f = Math.tan(Math.PI * 0.5 - 0.5 * fovRad);
		const rangeInv = 1.0 / (camera.near - camera.far);

		const m0 = f / camera.aspect;
		const m5 = f;
		const m10 = (camera.near + camera.far) * rangeInv;
		const m11 = -1;
		const m14 = camera.near * camera.far * rangeInv * 2 + camera.z;
		const m15 = camera.z;

		return [m0, 0, 0, 0, 0, m5, 0, 0, 0, 0, m10, m11, 0, 0, m14, m15];
	}

	public render() {
		const { gl } = this;

		gl.enable(gl.BLEND);
		gl.enable(gl.CULL_FACE);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		gl.disable(gl.DEPTH_TEST);

		this.updateBuffers();
		this.updateUniforms();
		this.resize(true);

		this.time = {
			start: window.performance.now(),
			previous: window.performance.now(),
		};

		if (this.raf) window.cancelAnimationFrame(this.raf);
		this.raf = window.requestAnimationFrame(this.update);

		return this;
	}

	private resize(updateSnowflakes = false) {
		const { canvas, gl } = this;
		const vw = canvas.offsetWidth;
		const vh = canvas.offsetHeight;
		const aspect = vw / vh;
		const dpi = window.devicePixelRatio;

		canvas.width = vw * dpi;
		canvas.height = vh * dpi;

		gl.viewport(0, 0, vw * dpi, vh * dpi);
		gl.clearColor(0, 0, 0, 0);

		if (updateSnowflakes === true) {
			this.initSnowflakes(vw, vh, dpi);
		}

		this.setUniform('projection', this.setProjection(aspect));
	}

	private update(timestamp: number) {
		const { gl, buffers, wind } = this;
		const elapsed = (timestamp - this.time.start) * this.speed;
		const delta = timestamp - this.time.previous;

		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(
			gl.POINTS,
			0,
			buffers.position.value.length / buffers.position.size,
		);

		if (Math.random() > 0.995) {
			wind.target =
				(wind.min + Math.random() * (wind.max - wind.min)) *
				(Math.random() > 0.5 ? -1 : 1);
		}

		wind.force += (wind.target - wind.force) * wind.easing;
		wind.current += wind.force * (delta * 0.2);

		this.setUniform('wind', wind.current);
		this.setUniform('time', elapsed);

		this.time.previous = timestamp;

		this.raf = window.requestAnimationFrame(this.update);
	}
}
