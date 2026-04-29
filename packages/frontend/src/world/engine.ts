/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { AxesViewer } from '@babylonjs/core/Debug/axesViewer';
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic';
import { EventEmitter } from 'eventemitter3';
import tinycolor from 'tinycolor2';
import Hls from 'hls.js';
import { RecyvlingTextGrid, Timer, WORLD_SCALE, camelToKebab, cm, createPlaneUvMapper, normalizeUvToSquare, randomRange } from './utility.js';
import { TIME_MAP } from './utility.js';
import { genId } from '@/utility/id.js';
import { deepClone } from '@/utility/clone.js';

const SNAPSHOT_RENDERING = false; // 実験的
const USE_GLOW = true; // ドローコールが増えて重い
const IN_WEB_WORKER = typeof window === 'undefined';

export type WorldEngineEvents = {
	'playSfxUrl': (ctx: {
		url: string;
		options: {
			volume: number;
			playbackRate: number;
		};
	}) => void;
	'loadingProgress': (ctx: { progress: number }) => void;
};

export class WorldEngine extends EventEmitter<WorldEngineEvents> {
	private canvas: HTMLCanvasElement;
	private engine: BABYLON.WebGPUEngine;
	public scene: BABYLON.Scene;
	private shadowGeneratorForSunLight: BABYLON.ShadowGenerator;
	public camera: BABYLON.UniversalCamera;
	private time: 0 | 1 | 2 = 0; // 0: 昼, 1: 夕, 2: 夜
	private envMap: BABYLON.CubeTexture;
	public lightContainer: BABYLON.ClusteredLightContainer;
	public sr: BABYLON.SnapshotRenderingHelper;
	private gl: BABYLON.GlowLayer | null = null;
	private textMaterial: BABYLON.StandardMaterial;
	private translucentTextMaterial: BABYLON.StandardMaterial;
	private reflectionProbe: BABYLON.ReflectionProbe;
	public timer: Timer = new Timer();

	public isSitting = false;
	private fps: number | null = null;
	private disposed = false;

	public domEvents: EventEmitter<{
		'click': (event: { offsetX: number; offsetY: number; }) => void;
		'keydown': (event: { code: string; shiftKey: boolean; }) => void;
		'keyup': (event: { code: string; shiftKey: boolean; }) => void;
		'wheel': (event: { deltaY: number; }) => void;
	}> = new EventEmitter();

	constructor(options: {
		canvas: HTMLCanvasElement;
		engine: BABYLON.WebGPUEngine;
	}) {
		super();

		this.canvas = options.canvas;

		registerBuiltInLoaders();

		this.engine = options.engine;
		this.scene = new BABYLON.Scene(this.engine);
		this.scene.autoClear = false;
		//this.scene.autoClearDepthAndStencil = false;
		this.scene.skipPointerMovePicking = true;
		this.scene.skipFrustumClipping = true; // snapshot renderingでは全てのメッシュがアクティブになっている必要があるため
		this.scene.gravity = new BABYLON.Vector3(0, -0.1, 0).scale(WORLD_SCALE);

		this.sr = new BABYLON.SnapshotRenderingHelper(this.scene);

		const skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: cm(50000) }, this.scene);
		const skyboxMat = new BABYLON.StandardMaterial('skyboxMat', this.scene);
		skyboxMat.backFaceCulling = false;
		skyboxMat.disableLighting = true;
		skybox.material = skyboxMat;
		skybox.infiniteDistance = true;

		this.time = TIME_MAP[new Date().getHours() as keyof typeof TIME_MAP];
		//this.time = TIME_MAP[12 as keyof typeof TIME_MAP];

		if (this.time === 0) {
			skyboxMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
		} else if (this.time === 1) {
			skyboxMat.emissiveColor = new BABYLON.Color3(0.7, 0.68, 0.66);
		} else {
			skyboxMat.emissiveColor = new BABYLON.Color3(0.48, 0.5, 0.6);
		}
		this.scene.ambientColor = new BABYLON.Color3(0.9, 0.9, 0.9);

		this.envMap = BABYLON.CubeTexture.CreateFromPrefilteredData(this.time === 2 ? '/client-assets/room/outdoor-night.env' : '/client-assets/room/outdoor-day.env', this.scene);
		//this.envMap.level = 1;
		this.envMap.level = 0;

		this.scene.collisionsEnabled = true;

		this.camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(cm(0), cm(250), cm(3000)), this.scene);
		this.camera.attachControl(this.canvas);
		this.camera.minZ = cm(1);
		this.camera.maxZ = cm(100000);
		this.camera.fov = 1;
		this.camera.ellipsoid = new BABYLON.Vector3(cm(15), cm(65), cm(15));
		this.camera.checkCollisions = true;
		this.camera.applyGravity = true;
		this.camera.needMoveForGravity = true;
		this.camera.keysUp.push(87); // W
		this.camera.keysDown.push(83); // S
		this.camera.keysLeft.push(65); // A
		this.camera.keysRight.push(68); // D
		const normalSpeed = 0.03 * WORLD_SCALE;
		this.camera.speed = normalSpeed;
		this.scene.onKeyboardObservable.add((kbInfo) => {
			switch (kbInfo.type) {
				case BABYLON.KeyboardEventTypes.KEYDOWN:
					if (kbInfo.event.key === 'Shift') {
						this.camera.speed = normalSpeed * 4;
					}
					break;
				case BABYLON.KeyboardEventTypes.KEYUP:
					if (kbInfo.event.key === 'Shift') {
						this.camera.speed = normalSpeed;
					}
					break;
			}
		});

		//this.scene.activeCamera = this.camera;

		//this.reflectionProbe = new BABYLON.ReflectionProbe('rp', 512, this.scene, true, true, false);
		//this.reflectionProbe.refreshRate = 60;

		//const mainLight = new BABYLON.PointLight('mainLight', new BABYLON.Vector3(0, cm(300), 0), this.scene);
		//mainLight.intensity = 10000000;
		//mainLight.radius = cm(1000);
		//mainLight.diffuse = new BABYLON.Color3(1, 1, 1);

		const ambientLight1 = new BABYLON.HemisphericLight('ambientLight1', new BABYLON.Vector3(0, 1, 0), this.scene);
		ambientLight1.diffuse = new BABYLON.Color3(1.0, 0.9, 0.8);
		ambientLight1.intensity = 1;
		const ambientLight2 = new BABYLON.HemisphericLight('ambientLight2', new BABYLON.Vector3(0, -1, 0), this.scene);
		ambientLight2.diffuse = new BABYLON.Color3(0.8, 0.9, 1.0);
		ambientLight2.intensity = 1;
		//ambientLight.intensity = 0;

		const sunLight = new BABYLON.DirectionalLight('sunLight', new BABYLON.Vector3(0, -1, 0), this.scene);
		sunLight.position = new BABYLON.Vector3(cm(0), cm(10000), cm(0));
		sunLight.diffuse = this.time === 0 ? new BABYLON.Color3(1.0, 1.0, 1.0) : this.time === 1 ? new BABYLON.Color3(1.0, 0.8, 0.6) : new BABYLON.Color3(0.6, 0.8, 1.0);
		sunLight.intensity = this.time === 0 ? 2 : this.time === 1 ? 0.5 : 0.25;
		sunLight.shadowMinZ = cm(1000);
		sunLight.shadowMaxZ = cm(2000);

		this.shadowGeneratorForSunLight = new BABYLON.ShadowGenerator(4096, sunLight);
		this.shadowGeneratorForSunLight.forceBackFacesOnly = true;
		this.shadowGeneratorForSunLight.bias = 0.0001;
		this.shadowGeneratorForSunLight.usePercentageCloserFiltering = true;
		this.shadowGeneratorForSunLight.usePoissonSampling = true;
		//this.shadowGeneratorForSunLight.getShadowMap().refreshRate = 60;

		this.lightContainer = new BABYLON.ClusteredLightContainer('clustered', [], this.scene);

		if (USE_GLOW) {
			this.gl = new BABYLON.GlowLayer('glow', this.scene, {
				//mainTextureFixedSize: 512,
				blurKernelSize: 64,
			});
			this.gl.intensity = 0.5;
			this.gl.addExcludedMesh(skybox);
			this.scene.setRenderingAutoClearDepthStencil(this.gl.renderingGroupId, false);

			if (SNAPSHOT_RENDERING) {
				this.sr.updateMeshesForEffectLayer(this.gl);
			}
		}

		if (_DEV_) {
			// snapshot renderingかつglow layerが有効だとなんかクラッシュする
			if (!(SNAPSHOT_RENDERING && USE_GLOW)) {
				//const axes = new AxesViewer(this.scene, 30);
				//axes.xAxis.position = new BABYLON.Vector3(0, 30, 0);
				//axes.yAxis.position = new BABYLON.Vector3(0, 30, 0);
				//axes.zAxis.position = new BABYLON.Vector3(0, 30, 0);
			}

			if (!IN_WEB_WORKER) {
				(window as any).showBabylonInspector = () => {
					import('@babylonjs/inspector').then(({ ShowInspector }) => {
						ShowInspector(this.scene);
					});
				};
			}
		}
	}

	public async init() {
		await this.loadEnvModel();

		if (SNAPSHOT_RENDERING) {
			this.sr.enableSnapshotRendering();
		}

		if (this.fps == null) {
			this.engine.runRenderLoop(() => {
				this.scene.render();
			});
		} else {
			let then = 0;
			const interval = 1000 / this.fps;

			const renderLoop = (timeStamp: number) => {
				if (this.disposed) return;

				window.requestAnimationFrame(renderLoop);

				const delta = timeStamp - then;
				if (delta <= interval) return;
				then = timeStamp - (delta % interval);

				this.engine.beginFrame();
				this.scene.render();
				this.engine.endFrame();
			};

			window.requestAnimationFrame(renderLoop);
		}

		this.domEvents.on('keydown', (ev) => {
		});

		this.domEvents.on('wheel', (ev) => {
			this.camera.fov += ev.deltaY * 0.001;
			this.camera.fov = Math.max(0.25, Math.min(1, this.camera.fov));
		});

		this.domEvents.on('click', (ev) => {

		});
	}

	private async loadEnvModel() {
		const envObj = await BABYLON.ImportMeshAsync('/client-assets/world/lobby/default.glb', this.scene);
		envObj.meshes[0].scaling = envObj.meshes[0].scaling.scale(WORLD_SCALE);
		envObj.meshes[0].bakeCurrentTransformIntoVertices();
		for (const mesh of envObj.meshes) {
			if (mesh.name === '__root__') continue;
			if (mesh.name.includes('__COLLISION__')) {
				mesh.checkCollisions = true;
				mesh.isVisible = false;
			}
			if (this.reflectionProbe != null) {
				if (mesh.material) (mesh.material as BABYLON.PBRMaterial).reflectionTexture = this.reflectionProbe.cubeTexture;
				if (mesh.material) (mesh.material as BABYLON.PBRMaterial).realTimeFiltering = true;
			}
		}

		this.textMaterial = new BABYLON.StandardMaterial('textMaterial', this.scene);
		this.textMaterial.diffuseTexture = new BABYLON.Texture('/client-assets/world/chars.png', this.scene, false, false);
		this.textMaterial.diffuseTexture.hasAlpha = true;
		this.textMaterial.disableLighting = true;
		this.textMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
		this.textMaterial.useAlphaFromDiffuseTexture = true;
		this.textMaterial.freeze();

		this.translucentTextMaterial = this.textMaterial.clone('translucentTextMaterial');
		this.translucentTextMaterial.alpha = 0.25;

		{
			const objet = envObj.meshes.find(m => m.name.includes('__OBJET__'));
			objet.rotation = objet.rotationQuaternion.toEulerAngles();
			objet.rotationQuaternion = null;

			const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
			anim.setKeys([
				{ frame: 0, value: 0 },
				{ frame: 5000, value: -(Math.PI * 2) },
			]);
			objet.animations = [anim];
			this.scene.beginAnimation(objet, 0, 5000, true);
		}

		{
			const ring = envObj.meshes.find(m => m.name.includes('__LED_RING__'));
			ring.rotation = ring.rotationQuaternion.toEulerAngles();
			ring.rotationQuaternion = null;

			const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
			anim.setKeys([
				{ frame: 0, value: 0 },
				{ frame: 5000, value: -(Math.PI * 2) },
			]);
			ring.animations = [anim];
			this.scene.beginAnimation(ring, 0, 5000, true);
		}

		{
			const messageRingRoot = new BABYLON.TransformNode('', this.scene);
			const messageRing = envObj.meshes.find(m => m.name.includes('__MESSAGE_RING_OUTER_1__'));
			messageRing.parent = messageRingRoot;
			messageRing.rotation = messageRing.rotationQuaternion.toEulerAngles();
			messageRing.rotationQuaternion = null;
			const text = new RecyvlingTextGrid(messageRing, 256, {
				meshFlipped: true,
				material: this.textMaterial,
			});

			text.write('Wellcome to Misskey World!');

			//messageRingRoot.rotation.x = Math.PI / 4;

			const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
			anim.setKeys([
				{ frame: 0, value: 0 },
				{ frame: 10000, value: -(Math.PI * 2) },
			]);
			messageRing.animations = [anim];
			this.scene.beginAnimation(messageRing, 0, 10000, true);

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
			const messageRingRoot = new BABYLON.TransformNode('', this.scene);
			const messageRing = envObj.meshes.find(m => m.name.includes('__MESSAGE_RING_OUTER_2__'));
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
			this.scene.beginAnimation(messageRing, 0, 10000, true);

			this.timer.setInterval(() => {
				text.write(Date.now().toString());
			}, 10);
		}

		{
			const messageRingRoot = new BABYLON.TransformNode('', this.scene);
			const messageRing = envObj.meshes.find(m => m.name.includes('__MESSAGE_RING_INNER_1__'));
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
			this.scene.beginAnimation(messageRing, 0, 10000, true);

			this.timer.setInterval(() => {
				const now = new Date();
				const hours = now.getHours().toString().padStart(2, '0');
				const minutes = now.getMinutes().toString().padStart(2, '0');
				const seconds = now.getSeconds().toString().padStart(2, '0');
				text.write(`${hours}:${minutes}:${seconds}`);
			}, 1000);
		}

		{
			const messageRingRoot = new BABYLON.TransformNode('', this.scene);
			const messageRing = envObj.meshes.find(m => m.name.includes('__MESSAGE_RING_INNER_2__'));
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
			this.scene.beginAnimation(messageRing, 0, 10000, true);

			this.timer.setInterval(() => {
				const now = new Date();
				const years = now.getFullYear().toString();
				const months = (now.getMonth() + 1).toString().padStart(2, '0');
				const days = now.getDate().toString().padStart(2, '0');
				text.write(`${years}/${months}/${days}`);
			}, 1000);
		}

		for (let i = 0; i < 16; i++) {
			const sphereRoot = new BABYLON.TransformNode('', this.scene);
			sphereRoot.position = new BABYLON.Vector3(cm(0), cm(1000 + (100 * i)), cm(0));
			const rotation = Math.random() * Math.PI * 2;
			const sphere = BABYLON.MeshBuilder.CreateSphere('', { diameter: cm(randomRange(50, 300)), segments: 16 }, this.scene);
			sphere.parent = sphereRoot;
			sphere.position = new BABYLON.Vector3(cm(0), cm(0), cm(randomRange(2000, 7000)));

			const mat = new BABYLON.PBRMaterial('', this.scene);
			const color = tinycolor({ h: Math.random() * 360, s: 1, l: 0.5 }).toRgb();
			mat.emissiveColor = new BABYLON.Color3(color.r / 255, color.g / 255, color.b / 255);
			mat.disableLighting = true;
			this.gl?.addExcludedMesh(sphere);
			sphere.material = mat;

			const speed = randomRange(5000, 30000);
			const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
			anim.setKeys([
				{ frame: 0, value: rotation },
				{ frame: speed, value: Math.random() < 0.5 ? rotation + (Math.PI * 2) : rotation - (Math.PI * 2) },
			]);
			sphereRoot.animations = [anim];
			this.scene.beginAnimation(sphereRoot, 0, speed, true);

			if (this.reflectionProbe != null) this.reflectionProbe.renderList.push(sphere);
		}

		for (let i = 0; i < 64; i++) {
			const sphereRoot = new BABYLON.TransformNode('', this.scene);
			sphereRoot.position = new BABYLON.Vector3(cm(0), cm(randomRange(-5000, 5000)), cm(0));
			const rotation = Math.random() * Math.PI * 2;
			const sphere = BABYLON.MeshBuilder.CreateSphere('', { diameter: cm(randomRange(500, 3000)), segments: 16 }, this.scene);
			sphere.parent = sphereRoot;
			sphere.position = new BABYLON.Vector3(cm(0), cm(0), cm(randomRange(10000, 15000)));

			const mat = new BABYLON.PBRMaterial('', this.scene);
			const color = tinycolor({ h: Math.random() * 360, s: randomRange(0, 1), l: randomRange(0.75, 1) }).toRgb();
			mat.emissiveColor = new BABYLON.Color3(color.r / 255, color.g / 255, color.b / 255);
			mat.disableLighting = true;
			this.gl?.addExcludedMesh(sphere);
			sphere.material = mat;

			const speed = randomRange(10000, 100000);
			const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
			anim.setKeys([
				{ frame: 0, value: rotation },
				{ frame: speed, value: Math.random() < 0.5 ? rotation + (Math.PI * 2) : rotation - (Math.PI * 2) },
			]);
			sphereRoot.animations = [anim];
			this.scene.beginAnimation(sphereRoot, 0, speed, true);

			if (this.reflectionProbe != null) this.reflectionProbe.renderList.push(sphere);
		}

		//const sphere = BABYLON.MeshBuilder.CreateSphere('', { diameter: cm(10) }, this.scene);

		const adsCountCol = 4;
		const adsCountRow = 2;
		for (let j = 0; j < adsCountRow; j++) {
			for (let i = 0; i < adsCountCol; i++) {
				const adRoot = new BABYLON.TransformNode(`ad_${j}_${i}_root`, this.scene);
				adRoot.position = new BABYLON.Vector3(cm(0), cm(500 + (1000 * j)), cm(0));
				const rotation = (i / adsCountCol) * Math.PI * 2;
				const adMesh = BABYLON.MeshBuilder.CreatePlane(`ad_${j}_${i}`, { width: cm(1000), height: cm(700) }, this.scene);
				adMesh.parent = adRoot;
				adMesh.position = new BABYLON.Vector3(cm(0), cm(0), cm(7500));

				const tex = new BABYLON.Texture('/client-assets/world/lobby/dummy-ads/angry_ai.png', this.scene);
				const adMat = new BABYLON.StandardMaterial(`ad_${j}_${i}_mat`, this.scene);
				adMat.emissiveTexture = tex;
				adMat.disableLighting = true;
				adMesh.material = adMat;

				const anim = new BABYLON.Animation('', 'rotation.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
				anim.setKeys([
					{ frame: 0, value: rotation },
					{ frame: 15000, value: j % 2 === 0 ? rotation + (Math.PI * 2) : rotation - (Math.PI * 2) },
				]);
				adRoot.animations = [anim];
				this.scene.beginAnimation(adRoot, 0, 15000, true);
			}
		}

		const worldRingH = envObj.meshes.find(m => m.name.includes('__WORLD_RING_H__'));
		const worldRingM = envObj.meshes.find(m => m.name.includes('__WORLD_RING_M__'));

		worldRingH.material.reflectionTexture = null;
		worldRingM.material.reflectionTexture = null;

		if (this.reflectionProbe != null) this.reflectionProbe.renderList.push(worldRingH);
		if (this.reflectionProbe != null) this.reflectionProbe.renderList.push(worldRingM);

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
		}, 100);

		const screenMeshes = envObj.meshes.filter(m => m.name.includes('__SCREEN__'));
		const screenMaterial = screenMeshes[0].material as BABYLON.PBRMaterial;

		const videoEl = document.createElement('video');
		videoEl.crossOrigin = 'anonymous';

		const hls = new Hls();
		hls.loadSource('https://tvs.misskey.io/official/hq-beta/ts:abr.m3u8');
		hls.attachMedia(videoEl);

		this.timer.setTimeout(() => {
			const tex = new BABYLON.VideoTexture('', videoEl, this.scene, true, true);
			tex.level = 0.5;
			tex.video.loop = true;
			tex.video.volume = 0.25;
			tex.video.muted = true;

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
					updateUv(srcAspect, targetAspect, 'cover');
				}
			});
		}, 3000);

		const emitter = new BABYLON.TransformNode('emitter', this.scene);
		emitter.position = new BABYLON.Vector3(0, cm(-1000), 0);
		const ps = new BABYLON.ParticleSystem('', 128, this.scene);
		ps.particleTexture = new BABYLON.Texture('/client-assets/room/objects/lava-lamp/bubble.png');
		ps.emitter = emitter;
		ps.isLocal = true;
		ps.minEmitBox = new BABYLON.Vector3(cm(-1000), 0, cm(-1000));
		ps.maxEmitBox = new BABYLON.Vector3(cm(1000), 0, cm(1000));
		ps.minEmitPower = cm(100);
		ps.maxEmitPower = cm(500);
		ps.minLifeTime = 30;
		ps.maxLifeTime = 30;
		ps.minSize = cm(30);
		ps.maxSize = cm(300);
		ps.direction1 = new BABYLON.Vector3(0, 1, 0);
		ps.direction2 = new BABYLON.Vector3(0, 1, 0);
		ps.emitRate = 1.5;
		ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
		ps.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
		ps.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
		ps.colorDead = new BABYLON.Color4(1, 1, 1, 0);
		ps.preWarmCycles = Math.random() * 1000;
		ps.start();
	}

	public sitChair(objectId: string) {
		this.isSitting = true;
		this.fixedCamera.parent = this.objectMeshs.get(objectId);
		this.fixedCamera.position = new BABYLON.Vector3(0, cm(120), 0);
		this.fixedCamera.rotation = new BABYLON.Vector3(0, 0, 0);
		this.scene.activeCamera = this.fixedCamera;
		this.selectObject(null);
	}

	public standUp() {
		this.isSitting = false;
		this.scene.activeCamera = this.camera;
		this.fixedCamera.parent = null;
	}

	private playSfxUrl(url: string, options: { volume: number; playbackRate: number }) {
		this.emit('playSfxUrl', { url, options });
	}

	public resize() {
		this.engine.resize();
	}

	public destroy() {
		this.timer.dispose();
		this.engine.dispose();
		this.disposed = true;
	}
}

class MessageRing {
	constructor(mesh: BABYLON.Mesh, scene: BABYLON.Scene, options: { material: BABYLON.StandardMaterial; repeatSeparator: string; }) {
		const messageRingRoot = new BABYLON.TransformNode('', this.scene);
		const messageRing = envObj.meshes.find(m => m.name.includes('__MESSAGE_RING_INNER_1__'));
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
		this.scene.beginAnimation(messageRing, 0, 10000, true);

		this.timer.setInterval(() => {
			const now = new Date();
			const hours = now.getHours().toString().padStart(2, '0');
			const minutes = now.getMinutes().toString().padStart(2, '0');
			const seconds = now.getSeconds().toString().padStart(2, '0');
			text.write(`${hours}:${minutes}:${seconds}`);
		}, 1000);
	}
}
