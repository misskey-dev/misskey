/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getProxiedImageUrl } from '../media-proxy.js';

type ParamTypeToPrimitive = {
	'number': number;
	'number:enum': number;
	'boolean': boolean;
	'align': { x: 'left' | 'center' | 'right'; y: 'top' | 'center' | 'bottom'; };
	'seed': number;
};

type ImageEffectorFxParamDefs = Record<string, {
	type: keyof ParamTypeToPrimitive;
	default: any;
}>;

export function defineImageEffectorFx<ID extends string, P extends ImageEffectorFxParamDefs>(fx: ImageEffectorFx<ID, P>) {
	return fx;
}

export type ImageEffectorFx<ID extends string, P extends ImageEffectorFxParamDefs> = {
	id: ID;
	name: string;
	shader: string;
	params: P,
	main: (ctx: {
		gl: WebGL2RenderingContext;
		program: WebGLProgram;
		params: {
			[key in keyof P]: ParamTypeToPrimitive[P[key]['type']];
		};
		preTexture: WebGLTexture;
		width: number;
		height: number;
		watermark?: {
			texture: WebGLTexture;
			width: number;
			height: number;
		};
	}) => void;
};

export type ImageEffectorLayer = {
	id: string;
	fxId: string;
	params: Record<string, any>;

	// for watermarkPlacement fx
	imageUrl?: string | null;
	text?: string | null;
};

export class ImageEffector {
	private canvas: HTMLCanvasElement | null = null;
	private gl: WebGL2RenderingContext | null = null;
	private renderTextureProgram!: WebGLProgram;
	private renderInvertedTextureProgram!: WebGLProgram;
	private renderWidth!: number;
	private renderHeight!: number;
	private originalImage: ImageData | ImageBitmap | HTMLImageElement | HTMLCanvasElement;
	private layers: ImageEffectorLayer[];
	private originalImageTexture: WebGLTexture;
	private bakedTexturesForWatermarkFx: Map<string, { texture: WebGLTexture; width: number; height: number; }> = new Map();
	private texturesKey: string;
	private shaderCache: Map<string, WebGLProgram> = new Map();
	private perLayerResultTextures: Map<string, WebGLTexture> = new Map();
	private perLayerResultFrameBuffers: Map<string, WebGLFramebuffer> = new Map();
	private fxs: ImageEffectorFx<string, any>[];

	constructor(options: {
		canvas: HTMLCanvasElement;
		width: number;
		height: number;
		originalImage: ImageData | ImageBitmap | HTMLImageElement | HTMLCanvasElement;
		layers: ImageEffectorLayer[];
		fxs: ImageEffectorFx<string, any>[];
	}) {
		this.canvas = options.canvas;
		this.canvas.width = options.width;
		this.canvas.height = options.height;
		this.renderWidth = options.width;
		this.renderHeight = options.height;
		this.originalImage = options.originalImage;
		this.layers = options.layers;
		this.fxs = options.fxs;
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
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, options.width, options.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.originalImage);
		gl.bindTexture(gl.TEXTURE_2D, null);

		this.renderTextureProgram = this.initShaderProgram(`#version 300 es
			in vec2 position;
			out vec2 in_uv;

			void main() {
				in_uv = (position + 1.0) / 2.0;
				gl_Position = vec4(position, 0.0, 1.0);
			}
		`, `#version 300 es
			precision mediump float;

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
			precision mediump float;

			in vec2 in_uv;
			uniform sampler2D u_texture;
			out vec4 out_color;

			void main() {
				out_color = texture(u_texture, in_uv);
			}
		`)!;
	}

	private calcTexturesKey() {
		return this.layers.map(layer => {
			if (layer.fxId === 'watermarkPlacement' && layer.imageUrl != null) {
				return layer.imageUrl;
			} else if (layer.fxId === 'watermarkPlacement' && layer.text != null) {
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

		for (const bakedTexture of this.bakedTexturesForWatermarkFx.values()) {
			gl.deleteTexture(bakedTexture.texture);
		}
		this.bakedTexturesForWatermarkFx.clear();
	}

	public async bakeTextures() {
		const gl = this.gl;
		if (gl == null) {
			throw new Error('gl is not initialized');
		}

		console.log('baking textures', this.texturesKey);

		this.disposeBakedTextures();

		for (const layer of this.layers) {
			if (layer.fxId === 'watermarkPlacement' && layer.imageUrl != null) {
				const image = await new Promise<HTMLImageElement>((resolve, reject) => {
					const img = new Image();
					img.onload = () => resolve(img);
					img.onerror = reject;
					img.src = getProxiedImageUrl(layer.imageUrl); // CORS対策
				});

				const texture = this.createTexture();
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
				gl.bindTexture(gl.TEXTURE_2D, null);

				this.bakedTexturesForWatermarkFx.set(layer.id, {
					texture: texture,
					width: image.width,
					height: image.height,
				});
			} else if (layer.fxId === 'watermarkPlacement' && layer.text != null) {
				const measureCtx = window.document.createElement('canvas').getContext('2d')!;
				measureCtx.canvas.width = this.renderWidth;
				measureCtx.canvas.height = this.renderHeight;
				const fontSize = Math.min(this.renderWidth, this.renderHeight) / 20;
				const margin = Math.min(this.renderWidth, this.renderHeight) / 50;
				measureCtx.font = `bold ${fontSize}px sans-serif`;
				const textMetrics = measureCtx.measureText(layer.text);
				measureCtx.canvas.remove();

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

				this.bakedTexturesForWatermarkFx.set(layer.id, {
					texture: texture,
					width: textCtx.canvas.width,
					height: textCtx.canvas.height,
				});

				textCtx.canvas.remove();
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

	private renderLayer(layer: ImageEffectorLayer, preTexture: WebGLTexture) {
		const gl = this.gl;
		if (gl == null) {
			throw new Error('gl is not initialized');
		}

		const fx = this.fxs.find(fx => fx.id === layer.fxId);
		if (fx == null) return;

		const watermark = layer.fxId === 'watermarkPlacement' ? this.bakedTexturesForWatermarkFx.get(layer.id) : undefined;

		const cachedShader = this.shaderCache.get(fx.id);
		const shaderProgram = cachedShader ?? this.initShaderProgram(`#version 300 es
			in vec2 position;
			out vec2 in_uv;

			void main() {
				in_uv = (position + 1.0) / 2.0;
				gl_Position = vec4(position, 0.0, 1.0);
			}
		`, fx.shader);
		if (cachedShader == null) {
			this.shaderCache.set(fx.id, shaderProgram);
		}

		gl.useProgram(shaderProgram);

		const u_resolution = gl.getUniformLocation(shaderProgram, 'u_resolution');
		gl.uniform2fv(u_resolution, [this.renderWidth, this.renderHeight]);

		fx.main({
			gl: gl,
			program: shaderProgram,
			params: Object.fromEntries(
				Object.entries(fx.params).map(([key, param]) => {
					return [key, layer.params[key] ?? param.default];
				}),
			) as any,
			preTexture: preTexture,
			width: this.renderWidth,
			height: this.renderHeight,
			watermark: watermark,
		});

		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	public render() {
		const gl = this.gl;
		if (gl == null) {
			throw new Error('gl is not initialized');
		}

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

		let preTexture = this.originalImageTexture;

		for (const layer of this.layers) {
			const cachedResultTexture = this.perLayerResultTextures.get(layer.id);
			const resultTexture = cachedResultTexture ?? this.createTexture();
			if (cachedResultTexture == null) {
				this.perLayerResultTextures.set(layer.id, resultTexture);
			}
			gl.bindTexture(gl.TEXTURE_2D, resultTexture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.renderWidth, this.renderHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			gl.bindTexture(gl.TEXTURE_2D, null);

			const cachedResultFrameBuffer = this.perLayerResultFrameBuffers.get(layer.id);
			const resultFrameBuffer = cachedResultFrameBuffer ?? gl.createFramebuffer()!;
			if (cachedResultFrameBuffer == null) {
				this.perLayerResultFrameBuffers.set(layer.id, resultFrameBuffer);
			}
			gl.bindFramebuffer(gl.FRAMEBUFFER, resultFrameBuffer);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, resultTexture, 0);

			this.renderLayer(layer, preTexture);

			gl.bindFramebuffer(gl.FRAMEBUFFER, null);

			preTexture = resultTexture;
		}

		// --------------------

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.useProgram(this.renderInvertedTextureProgram);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, preTexture);

		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	public async updateLayers(layers: ImageEffectorLayer[]) {
		this.layers = layers;

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

		for (const shader of this.shaderCache.values()) {
			gl.deleteProgram(shader);
		}
		this.shaderCache.clear();

		for (const texture of this.perLayerResultTextures.values()) {
			gl.deleteTexture(texture);
		}
		this.perLayerResultTextures.clear();

		for (const framebuffer of this.perLayerResultFrameBuffers.values()) {
			gl.deleteFramebuffer(framebuffer);
		}
		this.perLayerResultFrameBuffers.clear();

		this.disposeBakedTextures();
		gl.deleteProgram(this.renderTextureProgram);
		gl.deleteProgram(this.renderInvertedTextureProgram);
		gl.deleteTexture(this.originalImageTexture);
	}
}
