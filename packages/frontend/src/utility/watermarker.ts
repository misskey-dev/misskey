/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const A_SHADER = `#version 300 es
precision highp float;

in vec2 in_uv;
uniform sampler2D u_texture_src;
uniform sampler2D u_texture_watermark;
uniform vec2 u_resolution_src;
uniform vec2 u_resolution_watermark;
uniform float u_scale;
uniform float u_angle;
uniform float u_opacity;
uniform bool u_repeat;
uniform int u_alignX; // 0: left, 1: center, 2: right
uniform int u_alignY; // 0: top, 1: center, 2: bottom
out vec4 out_color;

void main() {
	vec4 pixel = texture(u_texture_src, in_uv);

	float x_ratio = u_resolution_watermark.x / u_resolution_src.x;
	float y_ratio = u_resolution_watermark.y / u_resolution_src.y;
	float aspect_ratio = min(x_ratio, y_ratio) / max(x_ratio, y_ratio);
	float x_scale = x_ratio > y_ratio ? 1.0 * u_scale : aspect_ratio * u_scale;
	float y_scale = y_ratio > x_ratio ? 1.0 * u_scale : aspect_ratio * u_scale;
	float x_offset = u_alignX == 0 ? x_scale / 2.0 : u_alignX == 2 ? 1.0 - (x_scale / 2.0) : 0.5;
	float y_offset = u_alignY == 0 ? y_scale / 2.0 : u_alignY == 2 ? 1.0 - (y_scale / 2.0) : 0.5;

	if (!u_repeat) {
		bool isInside = in_uv.x > x_offset - (x_scale / 2.0) && in_uv.x < x_offset + (x_scale / 2.0) &&
										in_uv.y > y_offset - (y_scale / 2.0) && in_uv.y < y_offset + (y_scale / 2.0);
		if (!isInside) {
			out_color = pixel;
			return;
		}
	}

	vec4 watermarkPixel = texture(u_texture_watermark, vec2(
		(in_uv.x - (x_offset - (x_scale / 2.0))) / x_scale,
		(in_uv.y - (y_offset - (y_scale / 2.0))) / y_scale
	));

	out_color.r = mix(pixel.r, watermarkPixel.r, u_opacity * watermarkPixel.a);
	out_color.g = mix(pixel.g, watermarkPixel.g, u_opacity * watermarkPixel.a);
	out_color.b = mix(pixel.b, watermarkPixel.b, u_opacity * watermarkPixel.a);
	out_color.a = pixel.a * (1.0 - u_opacity * watermarkPixel.a) + watermarkPixel.a * u_opacity;
}
`;

export type WatermarkPreset = {
	id: string;
	name: string;
	layers: WatermarkerLayer[];
};

type WatermarkerTextLayer = {
	id: string;
	type: 'text';
	text: string;
	repeat: boolean;
	scale: number;
	alignX: 'left' | 'center' | 'right';
	alignY: 'top' | 'center' | 'bottom';
	opacity: number;
};

type WatermarkerImageLayer = {
	id: string;
	type: 'image';
	imageUrl: string | null;
	imageId: string | null;
	repeat: boolean;
	scale: number;
	alignX: 'left' | 'center' | 'right';
	alignY: 'top' | 'center' | 'bottom';
	opacity: number;
};

export type WatermarkerLayer = WatermarkerTextLayer | WatermarkerImageLayer;

export class Watermarker {
	private canvas: HTMLCanvasElement | null = null;
	public gl: WebGL2RenderingContext | null = null;
	public renderTextureProgram!: WebGLProgram;
	public renderInvertedTextureProgram!: WebGLProgram;
	public renderWidth!: number;
	public renderHeight!: number;
	public originalImage: HTMLImageElement;
	private preset: WatermarkPreset;
	private originalImageTexture: WebGLTexture;
	private resultTexture: WebGLTexture;
	private resultFrameBuffer: WebGLFramebuffer;
	private bakedTextures: Map<string, { texture: WebGLTexture; width: number; height: number; }> = new Map();
	private texturesKey: string;

	constructor(options: {
		canvas: HTMLCanvasElement;
		width: number;
		height: number;
		originalImage: HTMLImageElement;
		preset: WatermarkPreset;
	}) {
		this.canvas = options.canvas;
		this.canvas.width = options.width;
		this.canvas.height = options.height;
		this.renderWidth = options.width;
		this.renderHeight = options.height;
		this.originalImage = options.originalImage;
		this.preset = options.preset;
		this.texturesKey = this.calcTexturesKey();

		this.gl = this.canvas.getContext('webgl2', {
			preserveDrawingBuffer: false,
			alpha: true,
			premultipliedAlpha: false,
		})!;

		const gl = this.gl;

		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

		const VERTICES = new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]);
		const vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, VERTICES, gl.STATIC_DRAW);

		this.originalImageTexture = this.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.originalImageTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.originalImage.width, this.originalImage.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.originalImage);
		gl.bindTexture(gl.TEXTURE_2D, null);

		this.resultTexture = this.createTexture();
		this.resultFrameBuffer = gl.createFramebuffer()!;

		this.renderTextureProgram = this.initShaderProgram(`#version 300 es
			in vec2 position;
			out vec2 in_uv;

			void main() {
				in_uv = (position + 1.0) / 2.0;
				gl_Position = vec4(position, 0.0, 1.0);
			}
		`, `#version 300 es
			precision highp float;

			in vec2 in_uv;
			uniform sampler2D u_texture;
			out vec4 out_color;

			void main() {
				out_color = texture(u_texture, in_uv);
			}
		`)!;

		this.renderInvertedTextureProgram = this.initShaderProgram(`#version 300 es
			in vec2 position;
			out vec2 in_uv;

			void main() {
				in_uv = (position + 1.0) / 2.0;
				in_uv.y = 1.0 - in_uv.y;
				gl_Position = vec4(position, 0.0, 1.0);
			}
		`, `#version 300 es
			precision highp float;

			in vec2 in_uv;
			uniform sampler2D u_texture;
			out vec4 out_color;

			void main() {
				out_color = texture(u_texture, in_uv);
			}
		`)!;
	}

	private calcTexturesKey() {
		return this.preset.layers.map(layer => {
			if (layer.type === 'image') {
				return layer.imageId;
			} else if (layer.type === 'text') {
				return layer.text;
			}
			return '';
		}).join(';');
	}

	private createTexture(): WebGLTexture {
		const gl = this.gl!;
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.bindTexture(gl.TEXTURE_2D, null);
		return texture!;
	}

	public disposeBakedTextures() {
		const gl = this.gl;
		if (gl == null) {
			throw new Error('gl is not initialized');
		}

		for (const bakedTexture of this.bakedTextures.values()) {
			gl.deleteTexture(bakedTexture.texture);
		}
		this.bakedTextures.clear();
	}

	public async bakeTextures() {
		const gl = this.gl;
		if (gl == null) {
			throw new Error('gl is not initialized');
		}

		console.log('baking textures', this.texturesKey);

		this.disposeBakedTextures();

		for (const layer of this.preset.layers) {
			if (layer.type === 'image') {
				const image = await new Promise<HTMLImageElement>((resolve, reject) => {
					const img = new Image();
					img.crossOrigin = 'anonymous';
					img.onload = () => resolve(img);
					img.onerror = reject;
					img.src = layer.imageUrl;
				});

				const texture = this.createTexture();
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
				gl.bindTexture(gl.TEXTURE_2D, null);

				this.bakedTextures.set(layer.id, {
					texture: texture,
					width: image.width,
					height: image.height,
				});
			} else if (layer.type === 'text') {
				const measureCtx = window.document.createElement('canvas').getContext('2d')!;
				measureCtx.canvas.width = this.renderWidth;
				measureCtx.canvas.height = this.renderHeight;
				const fontSize = Math.min(this.renderWidth, this.renderHeight) / 20;
				const margin = Math.min(this.renderWidth, this.renderHeight) / 50;
				measureCtx.font = `bold ${fontSize}px sans-serif`;
				const textMetrics = measureCtx.measureText(layer.text);

				const RESOLUTION_FACTOR = 4;

				const textCtx = window.document.createElement('canvas').getContext('2d')!;
				textCtx.canvas.width = (Math.ceil(textMetrics.actualBoundingBoxRight + textMetrics.actualBoundingBoxLeft) + margin + margin) * RESOLUTION_FACTOR;
				textCtx.canvas.height = (Math.ceil(textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent) + margin + margin) * RESOLUTION_FACTOR;

				//textCtx.fillStyle = '#00ff00';
				//textCtx.fillRect(0, 0, textCtx.canvas.width, textCtx.canvas.height);

				textCtx.shadowColor = '#000000';
				textCtx.shadowBlur = 10 * RESOLUTION_FACTOR;

				textCtx.fillStyle = '#ffffff';
				textCtx.font = `bold ${fontSize * RESOLUTION_FACTOR}px sans-serif`;
				textCtx.textBaseline = 'middle';
				textCtx.textAlign = 'center';

				textCtx.fillText(layer.text, textCtx.canvas.width / 2, textCtx.canvas.height / 2);

				const texture = this.createTexture();
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textCtx.canvas.width, textCtx.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, textCtx.canvas);
				gl.bindTexture(gl.TEXTURE_2D, null);

				this.bakedTextures.set(layer.id, {
					texture: texture,
					width: textCtx.canvas.width,
					height: textCtx.canvas.height,
				});
			}
		}
	}

	public loadShader(type, source) {
		const gl = this.gl!;

		const shader = gl.createShader(type)!;

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

	public initShaderProgram(vsSource, fsSource): WebGLProgram {
		const gl = this.gl!;

		const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource)!;
		const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource)!;

		const shaderProgram = gl.createProgram()!;
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			alert(
				`failed to init shader: ${gl.getProgramInfoLog(
					shaderProgram,
				)}`,
			);
			throw new Error('failed to init shader');
		}

		return shaderProgram;
	}

	private renderTextOrImageLayer(layer: WatermarkerTextLayer | WatermarkerImageLayer) {
		const gl = this.gl;
		if (gl == null) {
			throw new Error('gl is not initialized');
		}

		const watermarkTexture = this.bakedTextures.get(layer.id);
		if (watermarkTexture == null) {
			return;
		}

		const shaderProgram = this.initShaderProgram(`#version 300 es
			in vec2 position;
			out vec2 in_uv;

			void main() {
				in_uv = (position + 1.0) / 2.0;
				gl_Position = vec4(position, 0.0, 1.0);
			}
		`, A_SHADER);

		gl.useProgram(shaderProgram);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.originalImageTexture);
		const u_texture_src = gl.getUniformLocation(shaderProgram, 'u_texture_src');
		gl.uniform1i(u_texture_src, 0);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, watermarkTexture.texture);
		const u_texture_watermark = gl.getUniformLocation(shaderProgram, 'u_texture_watermark');
		gl.uniform1i(u_texture_watermark, 1);

		const u_resolution_src = gl.getUniformLocation(shaderProgram, 'u_resolution_src');
		gl.uniform2fv(u_resolution_src, [this.renderWidth, this.renderHeight]);

		const u_resolution_watermark = gl.getUniformLocation(shaderProgram, 'u_resolution_watermark');
		gl.uniform2fv(u_resolution_watermark, [watermarkTexture.width, watermarkTexture.height]);

		const u_scale = gl.getUniformLocation(shaderProgram, 'u_scale');
		gl.uniform1f(u_scale, layer.scale);

		const u_opacity = gl.getUniformLocation(shaderProgram, 'u_opacity');
		gl.uniform1f(u_opacity, layer.opacity);

		const u_angle = gl.getUniformLocation(shaderProgram, 'u_angle');
		gl.uniform1f(u_angle, 0.0);

		const u_repeat = gl.getUniformLocation(shaderProgram, 'u_repeat');
		gl.uniform1i(u_repeat, layer.repeat ? 1 : 0);

		const u_alignX = gl.getUniformLocation(shaderProgram, 'u_alignX');
		gl.uniform1i(u_alignX, layer.alignX === 'left' ? 0 : layer.alignX === 'right' ? 2 : 1);

		const u_alignY = gl.getUniformLocation(shaderProgram, 'u_alignY');
		gl.uniform1i(u_alignY, layer.alignY === 'top' ? 0 : layer.alignY === 'bottom' ? 2 : 1);

		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	private renderLayer(layer: WatermarkerLayer) {
		if (layer.type === 'image') {
			this.renderTextOrImageLayer(layer);
		} else if (layer.type === 'text') {
			this.renderTextOrImageLayer(layer);
		}
	}

	public async render() {
		const gl = this.gl;
		if (gl == null) {
			throw new Error('gl is not initialized');
		}

		gl.bindTexture(gl.TEXTURE_2D, this.resultTexture);
		gl.texImage2D(
			gl.TEXTURE_2D, 0, gl.RGBA, this.renderWidth, this.renderHeight, 0,
			gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.bindTexture(gl.TEXTURE_2D, null);

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.resultFrameBuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.resultTexture, 0);

		// --------------------

		{
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.originalImageTexture);

			gl.useProgram(this.renderTextureProgram);
			const u_texture = gl.getUniformLocation(this.renderTextureProgram, 'u_texture');
			gl.uniform1i(u_texture, 0);
			const u_resolution = gl.getUniformLocation(this.renderTextureProgram, 'u_resolution');
			gl.uniform2fv(u_resolution, [this.renderWidth, this.renderHeight]);
			const positionLocation = gl.getAttribLocation(this.renderTextureProgram, 'position');
			gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(positionLocation);

			gl.drawArrays(gl.TRIANGLES, 0, 6);
		}

		// --------------------

		for (const layer of this.preset.layers) {
			this.renderLayer(layer);
		}

		// --------------------

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.useProgram(this.renderInvertedTextureProgram);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.resultTexture);

		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	public async updatePreset(preset: WatermarkPreset) {
		this.preset = preset;

		const newTexturesKey = this.calcTexturesKey();
		if (newTexturesKey !== this.texturesKey) {
			this.texturesKey = newTexturesKey;
			await this.bakeTextures();
		}

		this.render();
	}

	public destroy() {
		const gl = this.gl;
		if (gl == null) {
			throw new Error('gl is not initialized');
		}

		this.disposeBakedTextures();
		gl.deleteProgram(this.renderTextureProgram);
		gl.deleteProgram(this.renderInvertedTextureProgram);
		gl.deleteTexture(this.originalImageTexture);
		gl.deleteTexture(this.resultTexture);
		gl.deleteFramebuffer(this.resultFrameBuffer);
	}
}
