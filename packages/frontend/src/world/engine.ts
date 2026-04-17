/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// TODO: 家具設置時のコリジョン判定(めりこんで設置されないようにする)
// TODO: 近くのオブジェクトの端にスナップオプション
// TODO: 近くのオブジェクトの原点に軸を揃えるオプション
// TODO: glbを事前に最適化(なるべくメッシュをマージするなど)するツールもしくはMisskeyビルド時処理。ついでにカタログ用スクショも自動生成したい

import * as BABYLON from '@babylonjs/core';
import { AxesViewer } from '@babylonjs/core/Debug/axesViewer';
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic';
import { EventEmitter } from 'eventemitter3';
import { HorizontalCameraKeyboardMoveInput, camelToKebab, cm } from './utility.js';
import { TIME_MAP } from './utility.js';
import { genId } from '@/utility/id.js';
import { deepClone } from '@/utility/clone.js';

const SNAPSHOT_RENDERING = true; // 実験的
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
	public intervalIds: number[] = [];
	public timeoutIds: number[] = [];
	private time: 0 | 1 | 2 = 0; // 0: 昼, 1: 夕, 2: 夜
	private envMapOutdoor: BABYLON.CubeTexture;
	public lightContainer: BABYLON.ClusteredLightContainer;
	public sr: BABYLON.SnapshotRenderingHelper;

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
		// なんかレンダリングがおかしくなるときがあるのでコメントアウト
		// オブジェクトを選択し、後ろを向いて別のオブジェクトを選択した後、最初のオブジェクトに振り返ると消えているなど
		//this.scene.performancePriority = BABYLON.ScenePerformancePriority.Intermediate;
		this.scene.autoClear = false;
		//this.scene.autoClearDepthAndStencil = false;
		this.scene.skipPointerMovePicking = true;
		this.scene.skipFrustumClipping = true; // snapshot renderingでは全てのメッシュがアクティブになっている必要があるため

		this.sr = new BABYLON.SnapshotRenderingHelper(this.scene);

		const skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: cm(1000) }, this.scene);
		const skyboxMat = new BABYLON.StandardMaterial('skyboxMat', this.scene);
		skyboxMat.backFaceCulling = false;
		skyboxMat.disableLighting = true;
		skybox.material = skyboxMat;
		skybox.infiniteDistance = true;

		this.time = TIME_MAP[new Date().getHours() as keyof typeof TIME_MAP];

		if (this.time === 0) {
			skyboxMat.emissiveColor = new BABYLON.Color3(0.7, 0.9, 1.0);
		} else if (this.time === 1) {
			skyboxMat.emissiveColor = new BABYLON.Color3(0.8, 0.5, 0.3);
		} else {
			skyboxMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.2);
		}
		this.scene.ambientColor = new BABYLON.Color3(1.0, 0.9, 0.8);

		this.envMapOutdoor = BABYLON.CubeTexture.CreateFromPrefilteredData(this.time === 2 ? '/client-assets/room/outdoor-night.env' : '/client-assets/room/outdoor-day.env', this.scene);
		this.envMapOutdoor.level = this.time === 0 ? 0.5 : this.time === 1 ? 0.3 : 0.1;

		this.scene.collisionsEnabled = true;

		this.camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, cm(130), cm(0)), this.scene);
		this.camera.inputs.removeByType('FreeCameraKeyboardMoveInput');
		this.camera.inputs.add(new HorizontalCameraKeyboardMoveInput(this.camera));
		this.camera.attachControl(this.canvas);
		this.camera.minZ = cm(1);
		this.camera.maxZ = cm(2000);
		this.camera.fov = 1;
		this.camera.ellipsoid = new BABYLON.Vector3(cm(15), cm(65), cm(15));
		this.camera.checkCollisions = true;
		this.camera.applyGravity = true;
		this.camera.needMoveForGravity = true;

		//this.scene.activeCamera = this.camera;

		const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, -0.5), this.scene);
		ambientLight.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
		ambientLight.intensity = 0.5;
		//ambientLight.intensity = 0;

		const sunLight = new BABYLON.DirectionalLight('sunLight', new BABYLON.Vector3(0.2, -1, -1), this.scene);
		sunLight.position = new BABYLON.Vector3(cm(-20), cm(1000), cm(1000));
		sunLight.diffuse = this.time === 0 ? new BABYLON.Color3(1.0, 0.9, 0.8) : this.time === 1 ? new BABYLON.Color3(1.0, 0.8, 0.6) : new BABYLON.Color3(0.6, 0.8, 1.0);
		sunLight.intensity = this.time === 0 ? 3 : this.time === 1 ? 1 : 0.25;
		sunLight.shadowMinZ = cm(1000);
		sunLight.shadowMaxZ = cm(2000);

		this.shadowGeneratorForSunLight = new BABYLON.ShadowGenerator(2048, sunLight);
		this.shadowGeneratorForSunLight.forceBackFacesOnly = true;
		this.shadowGeneratorForSunLight.bias = 0.0001;
		this.shadowGeneratorForSunLight.usePercentageCloserFiltering = true;
		this.shadowGeneratorForSunLight.usePoissonSampling = true;
		if (!SNAPSHOT_RENDERING) this.shadowGeneratorForSunLight.getShadowMap().refreshRate = 60; // snapshot renderingではrefreshRateが設定されているとなぜかクラッシュする

		this.lightContainer = new BABYLON.ClusteredLightContainer('clustered', [], this.scene);

		if (USE_GLOW) {
			const gl = new BABYLON.GlowLayer('glow', this.scene, {
				//mainTextureFixedSize: 512,
				blurKernelSize: 64,
			});
			gl.intensity = 0.5;
			this.scene.setRenderingAutoClearDepthStencil(gl.renderingGroupId, false);

			if (SNAPSHOT_RENDERING) {
				this.sr.updateMeshesForEffectLayer(gl);
			}
		}

		if (_DEV_) {
			// snapshot renderingかつglow layerが有効だとなんかクラッシュする
			if (!(SNAPSHOT_RENDERING && USE_GLOW)) {
				const axes = new AxesViewer(this.scene, 30);
				axes.xAxis.position = new BABYLON.Vector3(0, 30, 0);
				axes.yAxis.position = new BABYLON.Vector3(0, 30, 0);
				axes.zAxis.position = new BABYLON.Vector3(0, 30, 0);
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
		this.scene.blockMaterialDirtyMechanism = true;

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
		const envObj = await BABYLON.ImportMeshAsync('/client-assets/room/env.glb', this.scene);
		envObj.meshes[0].scaling = envObj.meshes[0].scaling.scale(WORLD_SCALE);
		envObj.meshes[0].bakeCurrentTransformIntoVertices();
		envObj.meshes[0].position = new BABYLON.Vector3(0, cm(-900), 0); // 4階くらいの想定
		envObj.meshes[0].rotation = new BABYLON.Vector3(0, -Math.PI, 0);
		for (const mesh of envObj.meshes) {
			mesh.isPickable = false;
			mesh.checkCollisions = false;

			//if (mesh.name === '__root__') continue;
			mesh.receiveShadows = false;
			if (mesh.material) (mesh.material as BABYLON.PBRMaterial).reflectionTexture = this.envMapOutdoor;
		}
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
		for (const id of this.intervalIds) {
			window.clearInterval(id);
		}
		for (const id of this.timeoutIds) {
			window.clearTimeout(id);
		}
		this.intervalIds = [];
		this.timeoutIds = [];
		this.engine.dispose();
		this.disposed = true;
	}
}
