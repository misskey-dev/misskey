/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { cm, WORLD_SCALE } from 'misskey-world/src/utility.js';
import tinycolor from 'tinycolor2';
import Hls from 'hls.js';
import { findMaterial, GRAPHICS_QUALITY, Timer } from '../utility.js';
import { WorldEnvManager } from '../env.js';
import { RecyvlingTextGrid, createPlaneUvMapper, randomRange } from '../utility.js';
import { Firework } from '../Firework.js';
import { getTimezoneOffsetLabel, timezones } from '../timezones.js';
import type { WorldEngine } from '../engine.js';

export class LobbyEnvManager extends WorldEnvManager {
	private loaderResult: BABYLON.ISceneLoaderAsyncResult | null = null;
	private meshes: BABYLON.Mesh[] = [];
	private skybox: BABYLON.Mesh | null = null;
	private skyboxMat: BABYLON.StandardMaterial | null = null;
	private sunLight: BABYLON.DirectionalLight | null = null;
	public envMapIndoor: BABYLON.CubeTexture | null = null;
	public maxCameraZ = cm(100000);
	private textMaterial: BABYLON.StandardMaterial | null = null;
	private textBwMaterial: BABYLON.StandardMaterial | null = null;
	private translucentTextMaterial: BABYLON.StandardMaterial | null = null;
	private timer: Timer = new Timer();
	private tz = timezones.find((tz) => tz.abbrev === 'JST')!;
	private applyDayPeriodCallbacks: ((dayPeriod: number) => void)[] = [];
	private floatingSphereAnimationObserver: BABYLON.Observer<BABYLON.Scene> | null = null;
	public EFFECT_RENDERING_GROUP = 1;

	constructor(engine: WorldEngine) {
		super(engine);
	}

	private registerShaders() {
		BABYLON.ShaderStore.ShadersStoreWGSL['AnimatingCirclesDecoPixelShader'] = `
			const PI = 3.141592653589793;
			const TWO_PI = 6.283185307179586;
			const HALF_PI = 1.5707963267948966;

			fn mod289_3(x: vec3f) -> vec3f {
				return x - floor(x * (1.0 / 289.0)) * 289.0;
			}

			fn mod289_4(x: vec4f) -> vec4f {
				return x - floor(x * (1.0 / 289.0)) * 289.0;
			}

			fn permute(x: vec4f) -> vec4f {
				return mod289_4(((x * 34.0) + 10.0) * x);
			}

			fn taylorInvSqrt(r: vec4f) -> vec4f {
				return 1.79284291400159 - 0.85373472095314 * r;
			}

			// -1.0 ~ +1.0
			fn snoise(v: vec3f) -> f32 {
				const C = vec2f(1.0 / 6.0, 1.0 / 3.0);
				const D = vec4f(0.0, 0.5, 1.0, 2.0);

				var i = floor(v + dot(v, C.yyy));
				var x0 = v - i + dot(i, C.xxx);

				var g = step(x0.yzx, x0.xyz);
				var l = 1.0 - g;
				var i1 = min(g.xyz, l.zxy);
				var i2 = max(g.xyz, l.zxy);

				var x1 = x0 - i1 + C.xxx;
				var x2 = x0 - i2 + C.yyy;
				var x3 = x0 - D.yyy;

				i = mod289_3(i);
				var p = permute(permute(permute(
									i.z + vec4f(0.0, i1.z, i2.z, 1.0))
								+ i.y + vec4f(0.0, i1.y, i2.y, 1.0))
								+ i.x + vec4f(0.0, i1.x, i2.x, 1.0));

				var n_ = 0.142857142857;
				var ns = n_ * D.wyz - D.xzx;

				var j = p - 49.0 * floor(p * ns.z * ns.z);

				var x_ = floor(j * ns.z);
				var y_ = floor(j - 7.0 * x_);

				var x = x_ * ns.x + ns.yyyy;
				var y = y_ * ns.x + ns.yyyy;
				var h = 1.0 - abs(x) - abs(y);

				var b0 = vec4f(x.xy, y.xy);
				var b1 = vec4f(x.zw, y.zw);

				var s0 = floor(b0) * 2.0 + 1.0;
				var s1 = floor(b1) * 2.0 + 1.0;
				var sh = -step(h, vec4f(0.0));

				var a0 = b0.xzyw + s0.xzyw * sh.xxyy;
				var a1 = b1.xzyw + s1.xzyw * sh.zzww;

				var p0 = vec3f(a0.xy, h.x);
				var p1 = vec3f(a0.zw, h.y);
				var p2 = vec3f(a1.xy, h.z);
				var p3 = vec3f(a1.zw, h.w);

				var norm = taylorInvSqrt(vec4f(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
				p0 *= norm.x;
				p1 *= norm.y;
				p2 *= norm.z;
				p3 *= norm.w;

				var m = max(0.5 - vec4f(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), vec4f(0.0));
				m = m * m;
				return 105.0 * dot(m * m, vec4f(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
			}

			// +0.0 ~ +1.0
			fn snoise0to1(v: vec3f) -> f32 {
				return (snoise(v) + 1.0) / 2.0;
			}

			// equivalent to GLSL's mod function
			fn modVec2f(a: vec2f, b: vec2f) -> vec2f {
				return a - b * floor(a / b);
			}

			fn premultiplyAlpha(color: vec4f) -> vec4f {
				return vec4f(color.rgb * color.a, color.a);
			}

			fn getPixelatedUv(uv: vec2f, cellSize: vec2f) -> vec2f {
				return (cellSize * floor(uv / cellSize)) + (cellSize / 2.0);
			}

			fn linearRisePulse(
				phase: f32, // 0.0～1.0
				riseLength: f32,
			) -> f32 {
				let _phase = fract(phase);
				let riseStart = 1.0 - riseLength; // 1周期の最後の riseLength 区間で 0→1
				return clamp((_phase - riseStart) / riseLength, 0.0, 1.0);
			}

			fn getV(uv: vec2f) -> f32 {
				let phaseField = snoise(vec3f(uv * uniforms.waveScale, uniforms.time * 0.005));
				let phase = fract((uniforms.time * 0.025) + phaseField);
				let pulseFrequency = 3.0;
				return linearRisePulse(phase * pulseFrequency, 0.3);
			}

			varying vUV: vec2f;
			uniform time: f32;
			uniform divisions: f32;
			uniform waveScale: f32;
			uniform colorA: vec3f;
			uniform colorB: vec3f;
			uniform colorC: vec3f;

			@fragment
			fn main(input: FragmentInputs) -> FragmentOutputs {
				let uv = input.vUV;
				let cellSize = vec2f(1.0 / (uniforms.divisions * 0.5));
				let modUv = modVec2f(uv, cellSize);
				let cellUv = getPixelatedUv(uv, cellSize);

				let v = getV(cellUv);

				var color = vec4f(1.0, 1.0, 1.0, 0.0);
				let dist = distance(modUv, cellSize * 0.5);
				let radius1 = clamp(v * 5.0, 0.0, 1.0);
				let radius2 = clamp(v * 2.0, 0.0, 1.0);
				let radius3 = clamp(max(0.0, v - 0.25) * 2.0, 0.0, 1.0);
				let radius4 = max(0.0, v - 0.5) * 2.0;
				let transparency = max(0.0, v - 0.75) * 4.0;

				if (dist < radius1 * (cellSize.x * 0.5)) { color = vec4f(uniforms.colorA, 1.0); }
				if (dist < radius2 * (cellSize.x * 0.5)) { color = vec4f(uniforms.colorB, 1.0); }
				if (dist < radius3 * (cellSize.x * 0.5)) { color = vec4f(uniforms.colorC, 1.0); }
				if (dist < radius4 * (cellSize.x * 0.5)) { color = vec4f(1.0, 1.0, 1.0, 0.0); }

				color.a *= 1.0 - transparency;

				//fragmentOutputs.color = premultiplyAlpha(color); // なんか半透明のときに黒ずむ
				fragmentOutputs.color = color;
			}
		`;

		BABYLON.ShaderStore.ShadersStoreWGSL['MoonPhasesPixelShader'] = `
			const PI = 3.141592653589793;
			const TWO_PI = 6.283185307179586;
			const HALF_PI = 1.5707963267948966;

			varying vUV: vec2f;
			uniform time: f32;
			uniform divisions: f32;
			uniform outlineWidth: f32;
			uniform color: vec3f;
			uniform outlineColor: vec3f;

			fn modVec2f(a: vec2f, b: vec2f) -> vec2f {
				return a - b * floor(a / b);
			}

			fn premultiplyAlpha(color: vec4f) -> vec4f {
				return vec4f(color.rgb * color.a, color.a);
			}

			fn getPixelatedUv(uv: vec2f, cellSize: vec2f) -> vec2f {
				return (cellSize * floor(uv / cellSize)) + (cellSize / 2.0);
			}

			fn hashU32(value: u32) -> u32 {
				var x = value;
				x ^= x >> 16u;
				x *= 0x7feb352du;
				x ^= x >> 15u;
				x *= 0x846ca68bu;
				x ^= x >> 16u;
				return x;
			}

			fn rand(seed: vec2f) -> f32 {
				let bits = bitcast<vec2u>(seed);
				let hash = hashU32(bits.x ^ hashU32(bits.y + 0x9e3779b9u));
				return f32(hash >> 8u) * (1.0 / 16777216.0);
			}

			fn linearRisePulse(
				phase: f32, // 0.0～1.0
				riseLength: f32,
			) -> f32 {
				let _phase = fract(phase);
				let riseStart = 1.0 - riseLength; // 1周期の最後の riseLength 区間で 0→1
				return clamp((_phase - riseStart) / riseLength, 0.0, 1.0);
			}

			fn getV(uv: vec2f) -> f32 {
				let dutyCycleFactor = 0.15;
				let dutyCycle = max(rand(uv), 0.1) * dutyCycleFactor;
				let phase = fract((uniforms.time - 1000.0) * 0.06 * dutyCycle);
				return linearRisePulse(phase, dutyCycle);
			}

			@fragment
			fn main(input: FragmentInputs) -> FragmentOutputs {
				let uv = input.vUV;
				let cellSize = vec2f(1.0 / (uniforms.divisions * 0.5));
				let modUv = modVec2f(uv, cellSize);
				let cellUv = getPixelatedUv(uv, cellSize);

				let v = getV(cellUv + 1.0);

				var color = vec4f(0.0, 0.0, 0.0, 0.0);

				let mainDist = distance(modUv, cellSize * 0.5);
				let radiusMain = v - uniforms.outlineWidth;
				if (mainDist < radiusMain * (cellSize.x * 0.5)) { color = vec4f(uniforms.color, 1.0); }

				let subDelay = 0.25;
				let subFactor = 1.05;
				let subPosOffset = vec2f(0.07, -0.07);
				let subPosOffsetRotation = (rand(cellUv) * TWO_PI) + ((uniforms.time - 1000.0) * 0.04);
				let subPosOffsetRotated = vec2f(subPosOffset.x * cos(subPosOffsetRotation) - subPosOffset.y * sin(subPosOffsetRotation), subPosOffset.x * sin(subPosOffsetRotation) + subPosOffset.y * cos(subPosOffsetRotation));
				let subDist = distance(modUv, (cellSize * 0.5) + (subPosOffsetRotated * (cellSize * 0.5)));
				let radiusSub = (((v - subDelay) / (1.0 - subDelay)) * subFactor) + uniforms.outlineWidth;
				if (subDist < radiusSub * (cellSize.x * 0.5)) { color = vec4f(0.0, 0.0, 0.0, 0.0); }

				let mainOutline = mainDist < (radiusMain + uniforms.outlineWidth) * (cellSize.x * 0.5) && mainDist > (radiusMain - uniforms.outlineWidth) * (cellSize.x * 0.5);
				let isSubInside = subDist < radiusSub * (cellSize.x * 0.5);
				if (mainOutline && !isSubInside) { color = vec4f(uniforms.outlineColor, 0.5); }

				let subOutline = subDist < (radiusSub + uniforms.outlineWidth) * (cellSize.x * 0.5) && subDist > (radiusSub - uniforms.outlineWidth) * (cellSize.x * 0.5);
				let isMainInside = mainDist < radiusMain * (cellSize.x * 0.5);
				if (subOutline && isMainInside) { color = vec4f(uniforms.outlineColor, 0.5); }

				let transparencyDelay = 0.75;
				let transparency = max(0.0, v - transparencyDelay) / (1.0 - transparencyDelay);

				color.a = color.a * (1.0 - transparency);

				fragmentOutputs.color = color;
				//fragmentOutputs.color = vec4f(0.0, 1.0, 0.0, 1.0); // debug
				//fragmentOutputs.color = vec4f(uv, 0.0, 1.0); // debug
				//fragmentOutputs.color = vec4f(v, v, 0.0, 1.0); // debug
			}
		`;
	}

	private setupMoonPhaseDecoPanels() {
		const panelTexture = new BABYLON.CustomProceduralTexture('', 'MoonPhases', this.engine.graphicsQuality >= GRAPHICS_QUALITY.MEDIUM ? 2048 : 1024, this.engine.scene, {
			shaderLanguage: BABYLON.ShaderLanguage.WGSL,
			skipJson: true,
		});
		panelTexture.animate = true;
		panelTexture.refreshRate = 1;
		panelTexture.setFloat('time', 0);
		panelTexture.setFloat('divisions', 8);
		panelTexture.setFloat('outlineWidth', 0.0025);
		panelTexture.setColor3('color', new BABYLON.Color3(0.6, 0.9, 1.0));
		panelTexture.setColor3('outlineColor', new BABYLON.Color3(0.7, 0.85, 0.9));
		panelTexture.hasAlpha = true;
		panelTexture.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
		panelTexture.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;

		const panelMaterial = new BABYLON.StandardMaterial('', this.engine.scene);
		panelMaterial.diffuseTexture = panelTexture;
		panelMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
		panelMaterial.disableLighting = true;
		panelMaterial.useAlphaFromDiffuseTexture = true;
		panelMaterial.backFaceCulling = true;

		const panelCount = 128;
		const panelDistance = cm(30000);
		const textureGridSize = 4;
		const textureCellSize = 1 / textureGridSize;
		const panels: BABYLON.Mesh[] = [];

		for (let i = 0; i < panelCount; i++) {
			const panel = BABYLON.MeshBuilder.CreatePlane('', {
				size: randomRange(cm(15000), cm(20000)),
				updatable: true,
			}, this.engine.scene);

			const y = randomRange(-1, 1);
			const azimuth = Math.random() * Math.PI * 2;
			const horizontalRadius = Math.sqrt(1 - (y * y));
			const outwardDirection = new BABYLON.Vector3(
				Math.cos(azimuth) * horizontalRadius,
				y,
				Math.sin(azimuth) * horizontalRadius,
			);
			panel.position = outwardDirection.scale(panelDistance);
			// CreatePlane's front face points along local -Z, so point local +Z away from the world center.
			panel.lookAt(panel.position.add(outwardDirection));
			panel.rotate(BABYLON.Axis.Z, Math.random() * Math.PI * 2, BABYLON.Space.LOCAL);

			const cellX = Math.floor(Math.random() * textureGridSize);
			const cellY = Math.floor(Math.random() * textureGridSize);
			const uvs = panel.getVerticesData(BABYLON.VertexBuffer.UVKind)!;
			for (let uvIndex = 0; uvIndex < uvs.length; uvIndex += 2) {
				uvs[uvIndex] = (uvs[uvIndex] + cellX) * textureCellSize;
				uvs[uvIndex + 1] = (uvs[uvIndex + 1] + cellY) * textureCellSize;
			}
			panel.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);

			panels.push(panel);
		}

		// merge meshes to reduce draw calls
		const mergedPanels = BABYLON.Mesh.MergeMeshes(panels, true, false, undefined, false, false)!;
		mergedPanels.name = 'moonPhaseDecoPanels';
		mergedPanels.material = panelMaterial;
		mergedPanels.infiniteDistance = true;
		mergedPanels.alphaIndex = 0;

		if (this.engine.gl != null) this.engine.gl.addExcludedMesh(mergedPanels);

		this.applyDayPeriodCallbacks.push((dayPeriod) => {
			if (dayPeriod === 1) {
				panelTexture.setColor3('color', new BABYLON.Color3(0.9, 0.7, 1.0));
				panelTexture.setColor3('outlineColor', new BABYLON.Color3(0.85, 0.7, 0.9));
			} else if (dayPeriod === 2) {
				panelTexture.setColor3('color', new BABYLON.Color3(0.1, 0.2, 0.3));
				panelTexture.setColor3('outlineColor', new BABYLON.Color3(0.5, 0.4, 0.6));
			}
		});
	}

	private setupAnimatingCirclesDecoPanels() {
		const panelTexture = new BABYLON.CustomProceduralTexture('', 'AnimatingCirclesDeco', 1024, this.engine.scene, {
			shaderLanguage: BABYLON.ShaderLanguage.WGSL,
			skipJson: true,
		});
		panelTexture.animate = true;
		panelTexture.refreshRate = 1;
		panelTexture.setFloat('time', 0);
		panelTexture.setFloat('divisions', 16);
		panelTexture.setFloat('waveScale', 1.5);
		panelTexture.setColor3('colorA', new BABYLON.Color3(0.7, 0.9, 0));
		panelTexture.setColor3('colorB', new BABYLON.Color3(0.9, 1, 0));
		panelTexture.setColor3('colorC', new BABYLON.Color3(1, 1, 1));
		panelTexture.hasAlpha = true;
		panelTexture.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
		panelTexture.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
		const panelMaterial = new BABYLON.StandardMaterial('', this.engine.scene);
		panelMaterial.diffuseTexture = panelTexture;
		panelMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
		panelMaterial.disableLighting = true;
		panelMaterial.useAlphaFromDiffuseTexture = true;
		panelMaterial.backFaceCulling = false;

		const decoPanels = this.meshes.filter(m => m.name.includes('__DECO_PANEL__'));

		// merge meshes to reduce draw calls
		const decoPanel = BABYLON.Mesh.MergeMeshes(decoPanels, true, false, undefined, false, false)!;

		decoPanel.material = panelMaterial;

		if (this.engine.gl != null) this.engine.gl.addExcludedMesh(decoPanel);
	}

	private setupFloatingSphereDecorations() {
		type SphereParams = {
			diameter: number;
			y: number;
			radius: number;
			initialRotation: number;
			angularVelocity: number;
		};

		const sphereCount = 80;
		const matrixBuffer = new Float32Array(sphereCount * 16);
		const outlineMatrixBuffer = new Float32Array(sphereCount * 16);
		const colorBuffer = new Float32Array(sphereCount * 4);
		const sphereParams: SphereParams[] = [];
		let sphereIndex = 0;

		const addSphere = (params: SphereParams & { color: { r: number; g: number; b: number; }; }) => {
			colorBuffer.set([params.color.r / 255, params.color.g / 255, params.color.b / 255, 1], sphereIndex * 4);
			sphereParams.push(params);
			sphereIndex++;
		};

		for (let i = 0; i < 16; i++) {
			const initialRotation = Math.random() * Math.PI * 2;
			const diameter = cm(randomRange(50, 300));
			const radius = cm(randomRange(2000, 7000));
			const color = tinycolor({ h: Math.random() * 360, s: 1, l: 0.5 }).toRgb();
			const durationFrames = randomRange(5000, 30000);
			const direction = Math.random() < 0.5 ? 1 : -1;

			addSphere({
				diameter,
				y: cm(1000 + (100 * i)),
				radius,
				initialRotation,
				angularVelocity: direction * ((Math.PI * 2) / durationFrames),
				color,
			});
		}

		for (let i = 0; i < 64; i++) {
			const y = cm(randomRange(-5000, 5000));
			const initialRotation = Math.random() * Math.PI * 2;
			const diameter = cm(randomRange(500, 3000));
			const radius = cm(randomRange(10000, 15000));
			const color = tinycolor({ h: Math.random() * 360, s: randomRange(0, 1), l: randomRange(0.75, 1) }).toRgb();
			const durationFrames = randomRange(10000, 100000);
			const direction = Math.random() < 0.5 ? 1 : -1;

			addSphere({
				diameter,
				y,
				radius,
				initialRotation,
				angularVelocity: direction * ((Math.PI * 2) / durationFrames),
				color,
			});
		}

		const sphere = BABYLON.MeshBuilder.CreateSphere('floatingSphereDecorations', {
			diameter: 1,
			segments: 16,
		}, this.engine.scene);
		const sphereOutline = BABYLON.MeshBuilder.CreateSphere('floatingSphereDecorationOutlines', {
			diameter: 1,
			segments: 16,
		}, this.engine.scene);

		const material = new BABYLON.StandardMaterial('floatingSphereDecorationsMaterial', this.engine.scene);
		material.emissiveColor = BABYLON.Color3.White();
		material.disableLighting = true;
		sphere.material = material;

		const outlineWidth = cm(4);
		const outlineMaterial = new BABYLON.StandardMaterial('floatingSphereDecorationOutlinesMaterial', this.engine.scene);
		outlineMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.6, 0.7);
		outlineMaterial.disableLighting = true;
		outlineMaterial.sideOrientation = BABYLON.Material.ClockWiseSideOrientation;
		sphereOutline.material = outlineMaterial;

		this.engine.gl?.addExcludedMesh(sphere);
		this.engine.gl?.addExcludedMesh(sphereOutline);
		this.engine.celShadingRenderer.excludeMesh(sphere);
		this.engine.celShadingRenderer.excludeMesh(sphereOutline);
		this.meshes.push(sphere, sphereOutline);

		const position = new BABYLON.Vector3();
		const rotation = new BABYLON.Quaternion();
		const scale = new BABYLON.Vector3();
		const matrix = new BABYLON.Matrix();
		let elapsedFrames = 0;
		const updateMatrices = () => {
			for (let i = 0; i < sphereParams.length; i++) {
				const params = sphereParams[i];
				const angle = params.initialRotation + (elapsedFrames * params.angularVelocity);
				position.set(Math.sin(angle) * params.radius, params.y, Math.cos(angle) * params.radius);
				BABYLON.Quaternion.RotationAxisToRef(BABYLON.Axis.Y, angle, rotation);
				scale.setAll(params.diameter);
				BABYLON.Matrix.ComposeToRef(scale, rotation, position, matrix);
				matrix.copyToArray(matrixBuffer, i * 16);
				scale.setAll(params.diameter + (outlineWidth * 2));
				BABYLON.Matrix.ComposeToRef(scale, rotation, position, matrix);
				matrix.copyToArray(outlineMatrixBuffer, i * 16);
			}
		};

		updateMatrices();
		sphere.thinInstanceSetBuffer('matrix', matrixBuffer, 16, false);
		sphere.thinInstanceSetBuffer('instanceColor', colorBuffer, 4, true);
		sphereOutline.thinInstanceSetBuffer('matrix', outlineMatrixBuffer, 16, false);

		this.floatingSphereAnimationObserver = this.engine.scene.onBeforeRenderObservable.add(() => {
			elapsedFrames += this.engine.scene.getAnimationRatio();
			updateMatrices();
			sphere.thinInstanceBufferUpdated('matrix');
			sphereOutline.thinInstanceBufferUpdated('matrix');
		});
	}

	public async load() {
		this.registerShaders();

		// パーティクルが背景よりも手前に描画されるようにするため
		this.engine.scene.setRenderingAutoClearDepthStencil(
			this.EFFECT_RENDERING_GROUP,
			false,
		);

		this.engine.camera.position = new BABYLON.Vector3(cm(0), cm(250), cm(3000));

		this.skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: cm(70000) }, this.engine.scene);
		this.skyboxMat = new BABYLON.StandardMaterial('skyboxMat', this.engine.scene);
		this.skyboxMat.backFaceCulling = false;
		this.skyboxMat.disableLighting = true;
		this.skybox.material = this.skyboxMat;
		this.skybox.infiniteDistance = true;
		this.engine.celShadingRenderer.excludeMesh(this.skybox);
		if (this.engine.gl != null) this.engine.gl.addExcludedMesh(this.skybox);

		const ambientLight1 = new BABYLON.HemisphericLight('ambientLight1', new BABYLON.Vector3(0, 1, 0), this.engine.scene);
		ambientLight1.diffuse = new BABYLON.Color3(1.0, 0.9, 0.8);
		ambientLight1.intensity = 1;
		const ambientLight2 = new BABYLON.HemisphericLight('ambientLight2', new BABYLON.Vector3(0, -1, 0), this.engine.scene);
		ambientLight2.diffuse = new BABYLON.Color3(0.8, 0.9, 1.0);
		ambientLight2.intensity = 1;
		//ambientLight.intensity = 0;

		this.sunLight = new BABYLON.DirectionalLight('sunLight', new BABYLON.Vector3(0, -1, 0), this.engine.scene);
		this.sunLight.position = new BABYLON.Vector3(cm(0), cm(10000), cm(0));
		this.sunLight.shadowMinZ = cm(1000);
		this.sunLight.shadowMaxZ = cm(2000);

		this.loaderResult = await BABYLON.ImportMeshAsync('/client-assets/world/envs/lobby/lobby.glb', this.engine.scene);

		//this.envMapIndoor = BABYLON.CubeTexture.CreateFromPrefilteredData('/client-assets/room/indoor.env', this.engine.scene);
		//this.envMapIndoor.boundingBoxSize = new BABYLON.Vector3(cm(500), cm(500), cm(500));

		this.meshes = this.loaderResult.meshes;
		this.meshes[0].scaling = this.meshes[0].scaling.scale(WORLD_SCALE);
		this.meshes[0].rotationQuaternion = null;
		this.meshes[0].rotation = new BABYLON.Vector3(0, 0, 0);
		this.meshes[0].bakeCurrentTransformIntoVertices();

		for (const mesh of this.meshes) {
			if (['__COLLISION__'].some(name => mesh.name.includes(name))) continue;
			mesh.receiveShadows = true;

			this.addShadowCaster(mesh);
		}

		this.textMaterial = new BABYLON.StandardMaterial('textMaterial', this.engine.scene);
		this.textMaterial.diffuseTexture = new BABYLON.Texture('/client-assets/world/envs/lobby/chars-black.png', this.engine.scene, false, false);
		this.textMaterial.diffuseTexture.hasAlpha = true;
		this.textMaterial.disableLighting = true;
		this.textMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
		this.textMaterial.useAlphaFromDiffuseTexture = true;
		this.textMaterial.freeze();

		this.textBwMaterial = new BABYLON.StandardMaterial('textBwMaterial', this.engine.scene);
		this.textBwMaterial.emissiveTexture = new BABYLON.Texture('/client-assets/world/envs/lobby/chars-bw.png', this.engine.scene, false, false);
		this.textBwMaterial.disableLighting = true;
		this.textBwMaterial.freeze();

		this.translucentTextMaterial = this.textMaterial.clone('translucentTextMaterial');
		this.translucentTextMaterial.alpha = 0.25;

		{
			const objet = this.meshes.find(m => m.name.includes('__OBJET__'));
			objet.rotation = objet.rotationQuaternion.toEulerAngles();
			objet.rotationQuaternion = null;

			const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
			anim.setKeys([
				{ frame: 0, value: 0 },
				{ frame: 5000, value: -(Math.PI * 2) },
			]);
			objet.animations = [anim];
			this.engine.scene.beginAnimation(objet, 0, 5000, true);

			this.engine.scene.onAfterAnimationsObservable.add(() => {
				this.engine.sr.updateMesh([objet, ...objet.getChildMeshes()], false);
			});
		}

		{
			const objet = this.meshes.find(m => m.name.includes('__MI__'));
			objet.rotation = objet.rotationQuaternion.toEulerAngles();
			objet.rotationQuaternion = null;

			const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
			anim.setKeys([
				{ frame: 0, value: 0 },
				{ frame: 5000, value: (Math.PI * 2) },
			]);
			objet.animations = [anim];
			this.engine.scene.beginAnimation(objet, 0, 5000, true);

			this.engine.scene.onAfterAnimationsObservable.add(() => {
				this.engine.sr.updateMesh([objet, ...objet.getChildMeshes()], false);
			});
		}

		{
			const ring = this.meshes.find(m => m.name.includes('__LED_RING__'));
			ring.rotation = ring.rotationQuaternion.toEulerAngles();
			ring.rotationQuaternion = null;

			const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
			anim.setKeys([
				{ frame: 0, value: 0 },
				{ frame: 5000, value: -(Math.PI * 2) },
			]);
			ring.animations = [anim];
			this.engine.scene.beginAnimation(ring, 0, 5000, true);

			this.engine.scene.onAfterAnimationsObservable.add(() => {
				this.engine.sr.updateMesh([ring, ...ring.getChildMeshes()], false);
			});
		}

		{
			const messageRingRoot = new BABYLON.TransformNode('', this.engine.scene);
			const messageRing = this.meshes.find(m => m.name.includes('__MESSAGE_RING_OUTER_1__'));
			messageRing.parent = messageRingRoot;
			messageRing.rotation = messageRing.rotationQuaternion.toEulerAngles();
			messageRing.rotationQuaternion = null;
			const text = new RecyvlingTextGrid(messageRing, 256, {
				meshFlipped: true,
				material: this.textBwMaterial,
			});

			text.write('Wellcome to Misskey World!');

			//messageRingRoot.rotation.x = Math.PI / 4;

			const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
			anim.setKeys([
				{ frame: 0, value: 0 },
				{ frame: 10000, value: -(Math.PI * 2) },
			]);
			messageRing.animations = [anim];
			this.engine.scene.beginAnimation(messageRing, 0, 10000, true);

			this.engine.scene.onAfterAnimationsObservable.add(() => {
				this.engine.sr.updateMesh([messageRing, ...messageRing.getChildMeshes()], false);
			});

			const texts = [
				'Wellcome to Misskey World!',
				'Enjoy your stay!',
				'Feel free to look around!',
				'This is a virtual space for Misskey users!',
				//'You can chat, play games, and more!',
				//'Check out the bulletin board for announcements',
				'Have a nice day with Misskey!',
				'MAINTENANCE will begin at 9:00 A.M.',
			];

			let currentTextIndex = 1;

			this.timer.setInterval(() => {
				const textToShow = texts[currentTextIndex];
				currentTextIndex = (currentTextIndex + 1) % texts.length;
				text.writeWithAnimation(textToShow);
			}, 10000);
		}

		{
			const messageRingRoot = new BABYLON.TransformNode('', this.engine.scene);
			const messageRing = this.meshes.find(m => m.name.includes('__MESSAGE_RING_OUTER_2__'));
			messageRing.parent = messageRingRoot;
			messageRing.rotation = messageRing.rotationQuaternion.toEulerAngles();
			messageRing.rotationQuaternion = null;
			const text = new RecyvlingTextGrid(messageRing, 256, {
				meshFlipped: true,
				material: this.translucentTextMaterial,
				repeatSeparator: '   ',
			});

			messageRingRoot.rotation.x = Math.PI / 2;

			const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
			anim.setKeys([
				{ frame: 0, value: 0 },
				{ frame: 10000, value: -(Math.PI * 2) },
			]);
			messageRing.animations = [anim];
			this.engine.scene.beginAnimation(messageRing, 0, 10000, true);

			this.engine.scene.onAfterAnimationsObservable.add(() => {
				this.engine.sr.updateMesh([messageRing, ...messageRing.getChildMeshes()], false);
			});

			this.timer.setInterval(() => {
				text.write(Date.now().toString());
			}, 10);
		}

		{
			const messageRingRoot = new BABYLON.TransformNode('', this.engine.scene);
			const messageRing = this.meshes.find(m => m.name.includes('__MESSAGE_RING_INNER_1__'));
			messageRing.parent = messageRingRoot;
			messageRing.rotation = messageRing.rotationQuaternion.toEulerAngles();
			messageRing.rotationQuaternion = null;
			const text = new RecyvlingTextGrid(messageRing, 64, {
				material: this.textMaterial,
				repeatSeparator: '  ',
			});

			//messageRingRoot.rotation.x = Math.PI / 4;

			const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
			anim.setKeys([
				{ frame: 0, value: 0 },
				{ frame: 10000, value: (Math.PI * 2) },
			]);
			messageRing.animations = [anim];
			this.engine.scene.beginAnimation(messageRing, 0, 10000, true);

			this.engine.scene.onAfterAnimationsObservable.add(() => {
				this.engine.sr.updateMesh([messageRing, ...messageRing.getChildMeshes()], false);
			});

			this.timer.setInterval(() => {
				const now = this.getCurrentTime();
				const hours = now.getHours().toString().padStart(2, '0');
				const minutes = now.getMinutes().toString().padStart(2, '0');
				const seconds = now.getSeconds().toString().padStart(2, '0');
				text.write(`${hours}:${minutes}:${seconds} ${getTimezoneOffsetLabel(this.tz.offset)}`);
			}, 1000);
		}

		{
			const messageRingRoot = new BABYLON.TransformNode('', this.engine.scene);
			const messageRing = this.meshes.find(m => m.name.includes('__MESSAGE_RING_INNER_2__'));
			messageRing.parent = messageRingRoot;
			messageRing.rotation = messageRing.rotationQuaternion.toEulerAngles();
			messageRing.rotationQuaternion = null;
			const text = new RecyvlingTextGrid(messageRing, 64, {
				material: this.textMaterial,
				repeatSeparator: '  ',
			});

			//messageRingRoot.rotation.x = Math.PI / 4;

			const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
			anim.setKeys([
				{ frame: 0, value: 0 },
				{ frame: 10000, value: -(Math.PI * 2) },
			]);
			messageRing.animations = [anim];
			this.engine.scene.beginAnimation(messageRing, 0, 10000, true);

			this.engine.scene.onAfterAnimationsObservable.add(() => {
				this.engine.sr.updateMesh([messageRing, ...messageRing.getChildMeshes()], false);
			});

			this.timer.setInterval(() => {
				const now = this.getCurrentTime();
				const years = now.getFullYear().toString();
				const months = (now.getMonth() + 1).toString().padStart(2, '0');
				const days = now.getDate().toString().padStart(2, '0');
				const dayOfWeek = now.getDay();
				const dayOfWeekStr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
				text.write(`${this.tz.abbrev} ${years}/${months}/${days} ${dayOfWeekStr.toUpperCase()}`);
			}, 1000);
		}

		this.setupFloatingSphereDecorations();

		/*
		const adsCountCol = 4;
		const adsCountRow = 2;
		const adRoots = [] as BABYLON.TransformNode[];
		for (let j = 0; j < adsCountRow; j++) {
			for (let i = 0; i < adsCountCol; i++) {
				const adRoot = new BABYLON.TransformNode(`ad_${j}_${i}_root`, this.engine.scene);
				adRoot.position = new BABYLON.Vector3(cm(0), cm(500 + (1000 * j)), cm(0));
				const rotation = (i / adsCountCol) * Math.PI * 2;
				const adMesh = BABYLON.MeshBuilder.CreatePlane(`ad_${j}_${i}`, { width: cm(1000), height: cm(700) }, this.engine.scene);
				adMesh.parent = adRoot;
				adMesh.position = new BABYLON.Vector3(cm(0), cm(0), cm(7500));

				const tex = new BABYLON.Texture('http://syu-win.local:3000/files/e67bd2ec-a217-4c17-a222-596dcdbd0e57', this.engine.scene);
				const adMat = new BABYLON.StandardMaterial(`ad_${j}_${i}_mat`, this.engine.scene);
				adMat.emissiveTexture = tex;
				adMat.disableLighting = true;
				adMesh.material = adMat;

				const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
				anim.setKeys([
					{ frame: 0, value: rotation },
					{ frame: 15000, value: j % 2 === 0 ? rotation + (Math.PI * 2) : rotation - (Math.PI * 2) },
				]);
				adRoot.animations = [anim];
				this.engine.scene.beginAnimation(adRoot, 0, 15000, true);

				adRoots.push(adRoot);
			}
		}

		this.engine.scene.onAfterAnimationsObservable.add(() => {
			this.engine.sr.updateMesh(adRoots.flatMap(adRoot => [...adRoot.getChildMeshes()]), false);
		});
		*/

		const worldRingH = this.meshes.find(m => m.name.includes('__WORLD_RING_H__'));
		const worldRingM = this.meshes.find(m => m.name.includes('__WORLD_RING_M__'));

		worldRingH.material.reflectionTexture = null;
		worldRingM.material.reflectionTexture = null;

		worldRingH.rotation = worldRingH.rotationQuaternion.toEulerAngles();
		worldRingM.rotation = worldRingM.rotationQuaternion.toEulerAngles();
		worldRingH.rotationQuaternion = null;
		worldRingM.rotationQuaternion = null;

		const _1h = 1000 * 60 * 60;
		const _12h = _1h * 12;
		const _7days = _1h * 24 * 7;
		const _30days = _1h * 24 * 30;

		this.timer.setInterval(() => {
			const time = Date.now();
			worldRingH.rotation.x = ((time % _12h) / _12h) * Math.PI * 2;
			worldRingM.rotation.y = -(((time % _1h) / _1h) * Math.PI);
			this.engine.sr.updateMesh([worldRingH, ...worldRingH.getChildMeshes(), worldRingM, ...worldRingM.getChildMeshes()], false);
		}, 100);

		const dome = this.meshes.find(m => m.name.includes('__DOME__'))!;
		dome.setParent(null); // parentが存在するとinfiniteDistanceが効かない
		dome.infiniteDistance = true;
		dome.alphaIndex = 1;
		const domeTexture = new BABYLON.CustomProceduralTexture('', '/client-assets/world/envs/lobby/shaders/bg', 4096, this.engine.scene);
		domeTexture.hasAlpha = true;
		domeTexture.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
		domeTexture.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
		dome.material = new BABYLON.StandardMaterial('', this.engine.scene);
		(dome.material as BABYLON.StandardMaterial).diffuseTexture = domeTexture;
		(dome.material as BABYLON.StandardMaterial).emissiveColor = new BABYLON.Color3(1, 1, 1);
		(dome.material as BABYLON.StandardMaterial).disableLighting = true;
		(dome.material as BABYLON.StandardMaterial).useAlphaFromDiffuseTexture = true;
		//this.engine.gl!.addExcludedMesh(dome);

		this.setupMoonPhaseDecoPanels();

		this.setupAnimatingCirclesDecoPanels();

		const screenMeshes = this.meshes.filter(m => m.name.includes('__SCREEN__'));
		const screenMaterial = screenMeshes[0].material as BABYLON.PBRMaterial;

		const videoEl = document.createElement('video');
		videoEl.crossOrigin = 'anonymous';
		//videoEl.src = 'http://syu-win.local:3000/files/931c02c3-6238-4c29-9371-06bab78950bb';

		const hls = new Hls();
		hls.loadSource('https://tvs.misskey.io/official/hq-beta/ts:abr.m3u8');
		hls.attachMedia(videoEl);

		this.timer.setTimeout(() => {
			const tex = new BABYLON.VideoTexture('', videoEl, this.engine.scene, true, true);
			tex.level = 0.5;
			tex.video.loop = true;
			tex.video.volume = 0.05;
			tex.video.muted = false;
			screenMaterial.albedoColor = new BABYLON.Color3(0, 0, 0);
			screenMaterial.emissiveTexture = tex;
			screenMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
			tex.onLoadObservable.addOnce(() => {
				tex.video.play();
				for (const mesh of screenMeshes) {
					if (mesh instanceof BABYLON.InstancedMesh) continue;
					//normalizeUvToSquare(mesh);
					const updateUv = createPlaneUvMapper(mesh);
					if (tex == null) return;
					const srcAspect = tex.getSize().width / tex.getSize().height;
					const targetAspect = 16 / 9;
					updateUv(srcAspect, targetAspect, 'cover', 0);
				}
			});
		}, 3000);

		const hourHands = this.meshes.filter(m => m.name.includes('__CLOCK_HAND_H__'));
		const minuteHands = this.meshes.filter(m => m.name.includes('__CLOCK_HAND_M__'));

		this.timer.setInterval(() => {
			const now = this.getCurrentTime();
			const hours = now.getHours() % 12;
			const minutes = now.getMinutes();
			const hAngle = -(hours / 12) * Math.PI * 2 - (minutes / 60) * (Math.PI * 2 / 12);
			const mAngle = -(minutes / 60) * Math.PI * 2;

			for (const hourHand of hourHands) hourHand.rotation = new BABYLON.Vector3(0, 0, hAngle);
			for (const minuteHand of minuteHands) minuteHand.rotation = new BABYLON.Vector3(0, 0, mAngle);

			this.engine.sr.updateMesh([...hourHands, ...minuteHands], false);
		}, 1000);

		//const emitter = new BABYLON.TransformNode('emitter', this.engine.scene);
		//emitter.position = new BABYLON.Vector3(0, cm(-1000), 0);
		//const ps = new BABYLON.ParticleSystem('', 128, this.engine.scene);
		//ps.particleTexture = new BABYLON.Texture('/client-assets/world/envs/lobby/bubble.png');
		//ps.emitter = emitter;
		//ps.isLocal = true;
		//ps.minEmitBox = new BABYLON.Vector3(cm(-1000), 0, cm(-1000));
		//ps.maxEmitBox = new BABYLON.Vector3(cm(1000), 0, cm(1000));
		//ps.minEmitPower = cm(100);
		//ps.maxEmitPower = cm(500);
		//ps.minLifeTime = 30;
		//ps.maxLifeTime = 30;
		//ps.minSize = cm(30);
		//ps.maxSize = cm(300);
		//ps.direction1 = new BABYLON.Vector3(0, 1, 0);
		//ps.direction2 = new BABYLON.Vector3(0, 1, 0);
		//ps.emitRate = 1.5;
		//ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
		//ps.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
		//ps.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
		//ps.colorDead = new BABYLON.Color4(1, 1, 1, 0);
		//ps.preWarmCycles = Math.random() * 1000;
		//ps.start();
		//this.engine.sr.fixParticleSystem(ps);

		const firework = new Firework(this.engine, this.EFFECT_RENDERING_GROUP);
		this.timer.setInterval(() => {
			firework.launch({
				position: [randomRange(cm(-5000), cm(5000)), cm(randomRange(1000, 3000)), randomRange(cm(-5000), cm(5000))],
			});
		}, 1000);

		this.registerMeshes(this.meshes);
	}

	public applyDayPeriod(dayPeriod: number) {
		if (this.skyboxMat == null) return;

		if (dayPeriod === 0) {
			this.skyboxMat.emissiveColor = new BABYLON.Color3(0.7, 0.9, 1.0);
		} else if (dayPeriod === 1) {
			this.skyboxMat.emissiveColor = new BABYLON.Color3(0.8, 0.5, 0.3);
		} else {
			this.skyboxMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.2);
		}

		if (this.sunLight != null) {
			this.sunLight.diffuse = dayPeriod === 0 ? new BABYLON.Color3(1.0, 0.9, 0.8) : dayPeriod === 1 ? new BABYLON.Color3(1.0, 0.8, 0.6) : new BABYLON.Color3(0.6, 0.8, 1.0);
			this.sunLight.intensity = dayPeriod === 0 ? 3 : dayPeriod === 1 ? 1 : 0.25;
		}

		for (const callback of this.applyDayPeriodCallbacks) {
			callback(dayPeriod);
		}
	}

	private getCurrentTime() {
		const now = new Date();
		now.setMinutes(now.getMinutes() + now.getTimezoneOffset() + this.tz.offset);
		return now;
	}

	public dispose() {
		this.timer.dispose();
		if (this.floatingSphereAnimationObserver != null) {
			this.engine.scene.onBeforeRenderObservable.remove(this.floatingSphereAnimationObserver);
			this.floatingSphereAnimationObserver = null;
		}
		for (const m of this.meshes) {
			m.dispose(false, true);
		}
		this.skybox?.dispose();
		this.skyboxMat?.dispose();
		this.envMapIndoor?.dispose();
		this.sunLight?.dispose();
		if (this.loaderResult != null) {
			for (const m of this.loaderResult.meshes) {
				m.dispose(false, true);
			}
			for (const t of this.loaderResult.transformNodes) {
				t.dispose(false, true);
			}
		}
		super.dispose();
	}
}

class MessageRing {
	constructor(mesh: BABYLON.Mesh, scene: BABYLON.Scene, options: { material: BABYLON.StandardMaterial; repeatSeparator: string; }) {
		const messageRingRoot = new BABYLON.TransformNode('', this.engine.scene);
		const messageRing = this.meshes.find(m => m.name.includes('__MESSAGE_RING_INNER_1__'));
		messageRing.parent = messageRingRoot;
		messageRing.rotation = messageRing.rotationQuaternion.toEulerAngles();
		messageRing.rotationQuaternion = null;
		const text = new RecyvlingTextGrid(messageRing, 64, {
			material: this.textMaterial,
			repeatSeparator: '  ',
		});

		//messageRingRoot.rotation.x = Math.PI / 4;

		const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
		anim.setKeys([
			{ frame: 0, value: 0 },
			{ frame: 10000, value: (Math.PI * 2) },
		]);
		messageRing.animations = [anim];
		this.engine.scene.beginAnimation(messageRing, 0, 10000, true);

		this.timer.setInterval(() => {
			const now = new Date();
			const hours = now.getHours().toString().padStart(2, '0');
			const minutes = now.getMinutes().toString().padStart(2, '0');
			const seconds = now.getSeconds().toString().padStart(2, '0');
			text.write(`${hours}:${minutes}:${seconds}`);
		}, 1000);
	}
}
