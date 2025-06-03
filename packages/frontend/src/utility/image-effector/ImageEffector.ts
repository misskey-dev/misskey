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
	'texture': { type: 'text'; text: string | null; } | { type: 'url'; url: string | null; } | null;
	'color': [r: number, g: number, b: number];
};

type ImageEffectorFxParamDefs = Record<string, {
	type: keyof ParamTypeToPrimitive;
	default: any;
}>;

export function defineImageEffectorFx<ID extends string, PS extends ImageEffectorFxParamDefs, US extends string[]>(fx: ImageEffectorFx<ID, PS, US>) {
	return fx;
}

export type ImageEffectorFx<ID extends string = string, PS extends ImageEffectorFxParamDefs = ImageEffectorFxParamDefs, US extends string[] = string[]> = {
	id: ID;
	name: string;
	shader: string;
	uniforms: US;
	params: PS,
	main: (ctx: {
		gl: WebGL2RenderingContext;
		program: WebGLProgram;
		params: {
			[key in keyof PS]: ParamTypeToPrimitive[PS[key]['type']];
		};
		u: Record<US[number], WebGLUniformLocation>;
		width: number;
		height: number;
		textures: Record<string, {
			texture: WebGLTexture;
			width: number;
			height: number;
		} | null>;
	}) => void;
};

export type ImageEffectorLayer = {
	id: string;
	fxId: string;
	params: Record<string, any>;
};

function getValue<T extends keyof ParamTypeToPrimitive>(params: Record<string, any>, k: string): ParamTypeToPrimitive[T] {
	return params[k];
}

export class ImageEffector {
	private gl: WebGL2RenderingContext;
	private canvas: HTMLCanvasElement | null = null;
	private renderTextureProgram: WebGLProgram;
	private renderInvertedTextureProgram: WebGLProgram;
	private renderWidth: number;
	private renderHeight: number;
	private originalImage: ImageData | ImageBitmap | HTMLImageElement | HTMLCanvasElement;
	private layers: ImageEffectorLayer[] = [];
	private originalImageTexture: WebGLTexture;
	private shaderCache: Map<string, WebGLProgram> = new Map();
	private perLayerResultTextures: Map<string, WebGLTexture> = new Map();
	private perLayerResultFrameBuffers: Map<string, WebGLFramebuffer> = new Map();
	private fxs: ImageEffectorFx[];
	private paramTextures: Map<string, { texture: WebGLTexture; width: number; height: number; }> = new Map();

	constructor(options: {
		canvas: HTMLCanvasElement;
		renderWidth: number;
		renderHeight: number;
		image: ImageData | ImageBitmap | HTMLImageElement | HTMLCanvasElement;
		fxs: ImageEffectorFx[];
	}) {
		this.canvas = options.canvas;
		this.renderWidth = options.renderWidth;
		this.renderHeight = options.renderHeight;
		this.originalImage = options.image;
		this.fxs = options.fxs;

		this.canvas.width = this.renderWidth;
		this.canvas.height = this.renderHeight;

		const gl = this.canvas.getContext('webgl2', {
			preserveDrawingBuffer: false,
			alpha: true,
			premultipliedAlpha: false,
		});

		if (gl == null) {
			throw new Error('Failed to initialize WebGL2 context');
		}

		this.gl = gl;

		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

		const VERTICES = new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]);
		const vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, VERTICES, gl.STATIC_DRAW);

		this.originalImageTexture = createTexture(gl);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.originalImageTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.originalImage.width, this.originalImage.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.originalImage);
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
		`);

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
		`);
	}

	public loadShader(type: GLenum, source: string): WebGLShader {
		const gl = this.gl;

		const shader = gl.createShader(type);
		if (shader == null) {
			throw new Error('falied to create shader');
		}

		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error(`falied to compile shader: ${gl.getShaderInfoLog(shader)}`);
			gl.deleteShader(shader);
			throw new Error(`falied to compile shader: ${gl.getShaderInfoLog(shader)}`);
		}

		return shader;
	}

	public initShaderProgram(vsSource: string, fsSource: string): WebGLProgram {
		const gl = this.gl;

		const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource);
		const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource);

		const shaderProgram = gl.createProgram();

		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			console.error(`failed to init shader: ${gl.getProgramInfoLog(shaderProgram)}`);
			throw new Error('failed to init shader');
		}

		return shaderProgram;
	}

	private renderLayer(layer: ImageEffectorLayer, preTexture: WebGLTexture) {
		const gl = this.gl;

		const fx = this.fxs.find(fx => fx.id === layer.fxId);
		if (fx == null) return;

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

		const in_resolution = gl.getUniformLocation(shaderProgram, 'in_resolution');
		gl.uniform2fv(in_resolution, [this.renderWidth, this.renderHeight]);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, preTexture);
		const in_texture = gl.getUniformLocation(shaderProgram, 'in_texture');
		gl.uniform1i(in_texture, 0);

		fx.main({
			gl: gl,
			program: shaderProgram,
			params: Object.fromEntries(
				Object.entries(fx.params).map(([key, param]) => {
					return [key, layer.params[key] ?? param.default];
				}),
			),
			u: Object.fromEntries(fx.uniforms.map(u => [u, gl.getUniformLocation(shaderProgram, 'u_' + u)!])),
			width: this.renderWidth,
			height: this.renderHeight,
			textures: Object.fromEntries(
				Object.entries(fx.params).map(([k, v]) => {
					if (v.type !== 'texture') return [k, null];
					const param = getValue<typeof v.type>(layer.params, k);
					if (param == null) return [k, null];
					const texture = this.paramTextures.get(this.getTextureKeyForParam(param)) ?? null;
					return [k, texture];
				})),
		});

		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	public render() {
		const gl = this.gl;

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
			const resultTexture = cachedResultTexture ?? createTexture(gl);
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

	public async setLayers(layers: ImageEffectorLayer[]) {
		this.layers = layers;

		const unused = new Set(this.paramTextures.keys());

		for (const layer of layers) {
			const fx = this.fxs.find(fx => fx.id === layer.fxId);
			if (fx == null) continue;

			for (const k of Object.keys(layer.params)) {
				const paramDef = fx.params[k];
				if (paramDef == null) continue;
				if (paramDef.type !== 'texture') continue;
				const v = getValue<typeof paramDef.type>(layer.params, k);
				if (v == null) continue;

				const textureKey = this.getTextureKeyForParam(v);
				unused.delete(textureKey);
				if (this.paramTextures.has(textureKey)) continue;

				console.log(`Baking texture of <${textureKey}>...`);

				const texture = v.type === 'text' ? await createTextureFromText(this.gl, v.text) : v.type === 'url' ? await createTextureFromUrl(this.gl, v.url) : null;
				if (texture == null) continue;

				this.paramTextures.set(textureKey, texture);
			}
		}

		for (const k of unused) {
			console.log(`Dispose unused texture <${k}>...`);
			this.gl.deleteTexture(this.paramTextures.get(k)!.texture);
			this.paramTextures.delete(k);
		}

		this.render();
	}

	public changeResolution(width: number, height: number) {
		this.renderWidth = width;
		this.renderHeight = height;
		if (this.canvas) {
			this.canvas.width = this.renderWidth;
			this.canvas.height = this.renderHeight;
		}
		this.gl.viewport(0, 0, this.renderWidth, this.renderHeight);
	}

	private getTextureKeyForParam(v: ParamTypeToPrimitive['texture']) {
		if (v == null) return '';
		return v.type === 'text' ? `text:${v.text}` : v.type === 'url' ? `url:${v.url}` : '';
	}

	/*
	 * disposeCanvas = true だとloseContextを呼ぶため、コンストラクタで渡されたcanvasも再利用不可になるので注意
	 */
	public destroy(disposeCanvas = true) {
		for (const shader of this.shaderCache.values()) {
			this.gl.deleteProgram(shader);
		}
		this.shaderCache.clear();

		for (const texture of this.perLayerResultTextures.values()) {
			this.gl.deleteTexture(texture);
		}
		this.perLayerResultTextures.clear();

		for (const framebuffer of this.perLayerResultFrameBuffers.values()) {
			this.gl.deleteFramebuffer(framebuffer);
		}
		this.perLayerResultFrameBuffers.clear();

		for (const texture of this.paramTextures.values()) {
			this.gl.deleteTexture(texture.texture);
		}
		this.paramTextures.clear();

		this.gl.deleteProgram(this.renderTextureProgram);
		this.gl.deleteProgram(this.renderInvertedTextureProgram);
		this.gl.deleteTexture(this.originalImageTexture);

		if (disposeCanvas) {
			const loseContextExt = this.gl.getExtension('WEBGL_lose_context');
			if (loseContextExt) loseContextExt.loseContext();
		}
	}
}

function createTexture(gl: WebGL2RenderingContext): WebGLTexture {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.bindTexture(gl.TEXTURE_2D, null);
	return texture;
}

async function createTextureFromUrl(gl: WebGL2RenderingContext, imageUrl: string | null): Promise<{ texture: WebGLTexture, width: number, height: number } | null> {
	if (imageUrl == null || imageUrl.trim() === '') return null;

	const image = await new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = getProxiedImageUrl(imageUrl); // CORS対策
	}).catch(() => null);

	if (image == null) return null;

	const texture = createTexture(gl);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.bindTexture(gl.TEXTURE_2D, null);

	return {
		texture,
		width: image.width,
		height: image.height,
	};
}

async function createTextureFromText(gl: WebGL2RenderingContext, text: string | null, resolution = 2048): Promise<{ texture: WebGLTexture, width: number, height: number } | null> {
	if (text == null || text.trim() === '') return null;

	const ctx = window.document.createElement('canvas').getContext('2d')!;
	ctx.canvas.width = resolution;
	ctx.canvas.height = resolution / 4;
	const fontSize = resolution / 32;
	const margin = fontSize / 2;
	ctx.shadowColor = '#000000';
	ctx.shadowBlur = fontSize / 4;

	//ctx.fillStyle = '#00ff00';
	//ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	ctx.fillStyle = '#ffffff';
	ctx.font = `bold ${fontSize}px sans-serif`;
	ctx.textBaseline = 'middle';

	ctx.fillText(text, margin, ctx.canvas.height / 2);

	const textMetrics = ctx.measureText(text);
	const cropWidth = (Math.ceil(textMetrics.actualBoundingBoxRight + textMetrics.actualBoundingBoxLeft) + margin + margin);
	const cropHeight = (Math.ceil(textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent) + margin + margin);
	const data = ctx.getImageData(0, (ctx.canvas.height / 2) - (cropHeight / 2), ctx.canvas.width, ctx.canvas.height);

	const texture = createTexture(gl);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cropWidth, cropHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
	gl.bindTexture(gl.TEXTURE_2D, null);

	const info = {
		texture: texture,
		width: cropWidth,
		height: cropHeight,
	};

	ctx.canvas.remove();

	return info;
}
