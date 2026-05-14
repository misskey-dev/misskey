/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// TODO: 家具設置時のコリジョン判定(めりこんで設置されないようにする)
// TODO: 近くのオブジェクトの端にスナップオプション
// TODO: 近くのオブジェクトの原点に軸を揃えるオプション
// TODO: glbを事前に最適化(なるべくメッシュをマージするなど)するツールもしくはMisskeyビルド時処理。ついでにカタログ用スクショも自動生成したい
// TODO: テクスチャ置き換え時、元のテクスチャをちゃんとdispose
// TODO: Safariでテクスチャの読み込みに失敗かつ無ハンドリングだとsrが有効にできなくなる現象をbabylonに報告

import * as BABYLON from '@babylonjs/core';
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic';
import { EventEmitter } from 'eventemitter3';
import { TIME_MAP, scaleMorph, camelToKebab, cm, WORLD_SCALE, getMeshesBoundingBox, Timer, getYRotationDirection, FreeCameraManualInput, remap } from '../utility.js';
import { getObjectDef } from './object-defs.js';
import { findMaterial, GRAPHICS_QUALITY, ModelManager, SYSTEM_HEYA_MESH_NAMES, SYSTEM_MESH_NAMES } from './utility.js';
import { JapaneseEnvManager, MuseumEnvManager, SimpleEnvManager } from './env.js';
import { convertRawOptions } from './object.js';
import type { RoomAttachments } from './utility.js';
import type { ConvertedOptions, ObjectDef, RawOptions, RoomObjectInstance, RoomStateObject } from './object.js';
import type { GridMaterial } from '@babylonjs/materials';
import type { EnvManager, JapaneseEnvOptions, SimpleEnvOptions } from './env.js';
import { genId } from '@/utility/id.js';
import { deepClone } from '@/utility/clone.js';

const BAKE_TRANSFORM = false; // 実験的
const IGNORE_OBJECTS: string[] = ['aquarium']; // for debug
const IN_WEB_WORKER = typeof window === 'undefined';

export type RoomState = {
	env: {
		type: 'simple';
		options: SimpleEnvOptions;
	} | {
		type: 'japanese';
		options: JapaneseEnvOptions;
	};
	roomLightColor: [number, number, number];
	installedObjects: RoomStateObject[];
	worldScale: number;
};

export function collectAttachmentFileIds(roomState: RoomState) {
	const fileIds = new Set<string>();
	for (const o of roomState.installedObjects) {
		const def = getObjectDef(o.type);
		for (const schemaRecord of Object.entries(def.options.schema)) {
			if (schemaRecord[1].type === 'file') {
				const optionValue = o.options[schemaRecord[0]];
				if (optionValue != null && optionValue !== '') {
					fileIds.add(optionValue);
				}
			}
		}
	}
	return fileIds;
}

function mergeMeshes(meshes: BABYLON.Mesh[], root: BABYLON.Mesh, hasTexture: boolean) {
	const excludeMeshes = root.getChildMeshes().filter(m => SYSTEM_MESH_NAMES.some(s => m.name.includes(s)));

	const childMeshes = root.getChildMeshes().filter(m => !excludeMeshes.some(x => x === m) && m.isVisible && !m.isDisposed());

	const toMerge = [] as BABYLON.Mesh[];
	for (const mesh of childMeshes) {
		if (mesh instanceof BABYLON.InstancedMesh) {
			continue;
		}

		if (mesh.hasInstances) continue;

		if (mesh instanceof BABYLON.Mesh) {
			toMerge.push(mesh);
		}
	}

	if (toMerge.length <= 1) { // マージ対象が一つしかない状態でマージするのは単純に無駄なのと、babylonのバグが知らないけどなぜか法線が反転する
		return null;
	}

	for (const mesh of toMerge) {
		if (hasTexture) {
			if (mesh.getVerticesData(BABYLON.VertexBuffer.UVKind) == null) {
				const vertexCount = mesh.getTotalVertices();
				const uvs = new Array(vertexCount * 2).fill(0);
				mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs, false, 2);
			}
			if (mesh.getVerticesData(BABYLON.VertexBuffer.UV2Kind) == null) {
				const vertexCount = mesh.getTotalVertices();
				const uvs = new Array(vertexCount * 2).fill(0);
				mesh.setVerticesData(BABYLON.VertexBuffer.UV2Kind, uvs, false, 2);
			}
		}
	}

	const merged = BABYLON.Mesh.MergeMeshes(toMerge, true, false, undefined, false, true);

	return merged;
}

function enableObjectCollision(meshes: BABYLON.Mesh[]) {
	for (const mesh of meshes) {
		if (mesh.name.includes('__COLLISION__')) {
			mesh.checkCollisions = true;
			//mesh.isVisible = true; // debug
		} else {
			mesh.checkCollisions = false;
		}
	}
}

export type RoomEngineEvents = {
	'changeSelectedState': (ctx: {
		selected: {
			objectId: string;
			objectState: RoomStateObject;
		} | null;
	}) => void;
	'changeGrabbingState': (ctx: { grabbing: { forInstall: boolean } | null }) => void;
	'changeEditMode': (ctx: { isEditMode: boolean }) => void;
	'changeGridSnapping': (ctx: { gridSnapping: { enabled: boolean; scale: number } }) => void;
	'changeRoomState': (ctx: { roomState: RoomState }) => void;
	'playSfxUrl': (ctx: {
		url: string;
		options: {
			volume: number;
			playbackRate: number;
		};
	}) => void;
	'loadingProgress': (ctx: { progress: number }) => void;
};

// TODO: RoomEngineBaseとしてabstract classを抽出
export class RoomEngine extends EventEmitter {
	private useGlow: boolean;
	private engine: BABYLON.WebGPUEngine;
	public scene: BABYLON.Scene;
	public camera: BABYLON.UniversalCamera;
	private fixedCamera: BABYLON.FreeCamera;
	public objectEntities: Map<string, {
		rootMesh: BABYLON.Mesh;
		convertedOptions: ConvertedOptions;
		instance: RoomObjectInstance;
		model: ModelManager;
	}> = new Map();
	private envManager: EnvManager | null = null;

	// TODO: たぶんオブジェクト内の値のmutateはsetで検知できないので、そのような操作を実際に行うようになった & それを検知する必要性が出てきたら専用の設定関数などを新設してそれを使わせる
	private _grabbingCtx: {
		objectId: string;
		objectType: string;
		forInstall: boolean;
		mesh: BABYLON.TransformNode;
		originalDiffOfPosition: BABYLON.Vector3;
		originalDiffOfRotation: BABYLON.Vector3;
		distance: number;
		rotation: number;
		ghost: BABYLON.TransformNode;
		descendantStickyObjectIds: string[];
		onMove?: (info: { position: BABYLON.Vector3; rotation: BABYLON.Vector3; sticky: string | null; }) => void;
		onCancel?: () => void;
		onDone?: () => void;
	} | null = null;
	get grabbingCtx() {
		return this._grabbingCtx;
	}
	set grabbingCtx(v) {
		this._grabbingCtx = v;
		this.ev('changeGrabbingState', { grabbing: v == null ? null : { forInstall: v.forInstall } });
	}

	// TODO: たぶんオブジェクト内の値のmutateはsetで検知できないので、そのような操作を実際に行うようになった & それを検知する必要性が出てきたら専用の設定関数などを新設してそれを使わせる
	private _selected: {
		objectId: string;
		objectEntity: RoomEngine['objectEntities'] extends Map<string, infer V> ? V : never;
		objectState: RoomStateObject;
		objectDef: ObjectDef;
	} | null = null;
	get selected() {
		return this._selected;
	}
	set selected(v) {
		this._selected = v;
		this.ev('changeSelectedState', { selected: v == null ? null : { objectId: v.objectId, objectState: v.objectState } });
	}

	private time: 0 | 1 | 2 = 0; // 0: 昼, 1: 夕, 2: 夜
	public roomState: RoomState;
	public roomAttachments: RoomAttachments;

	private _gridSnapping = { enabled: true, scale: cm(4) };
	get gridSnapping() {
		return this._gridSnapping;
	}
	set gridSnapping(v) {
		this._gridSnapping = v;
		if (this.gridMaterial != null) this.gridMaterial.gridRatio = v.scale; // setter内でconstructor内設定の値に依存するのはタイミングによってはundefinedになりそうなので、実際に当該マテリアルを表示する必要が生じる直前に利用側で設定させた方がいいかもしれない
		this.ev('changeGridSnapping', { gridSnapping: v });
	}

	private putParticleSystem: BABYLON.ParticleSystem;
	public lightContainer: BABYLON.ClusteredLightContainer;
	private gridMaterial: GridMaterial | null = null;
	private gridPlane: BABYLON.Mesh;
	private selectionOutlineLayer: BABYLON.SelectionOutlineLayer | null = null;
	public sr: BABYLON.SnapshotRenderingHelper;
	private gl: BABYLON.GlowLayer | null = null;
	public timer: Timer = new Timer();
	public graphicsQuality: number;

	private _isEditMode = false;
	get isEditMode() {
		return this._isEditMode;
	}
	set isEditMode(v) {
		this._isEditMode = v;
		this.ev('changeEditMode', { isEditMode: v });
	}

	public isSitting = false;
	private inited = false;
	private fps: number | null = null;
	private disposed = false;

	public inputs: EventEmitter<{
		'click': (event: { x: number; y: number; }) => void;
		'keydown': (event: { code: string; shiftKey: boolean; }) => void;
		'keyup': (event: { code: string; shiftKey: boolean; }) => void;
		'wheel': (event: { deltaY: number; }) => void;
		'zoom': (event: { delta: number; }) => void;
		'pointer': (event: { x: number; y: number; }) => void;
	}> = new EventEmitter();

	constructor(roomState: RoomState, roomAttachments: RoomAttachments, options: {
		engine: BABYLON.WebGPUEngine;
		graphicsQuality: number;
		fps: number | null;
		antialias: boolean;
		useVirtualJoystick?: boolean;
	}) {
		super();

		this.roomState = {
			...JSON.parse(JSON.stringify(roomState)),
			installedObjects: roomState.installedObjects.map(o => ({
				...o,
				options: { ...getObjectDef(o.type).options.default, ...o.options },
			})),
		};
		this.roomAttachments = roomAttachments;
		this.graphicsQuality = options.graphicsQuality;
		this.fps = options.fps;
		this.useGlow = this.graphicsQuality >= GRAPHICS_QUALITY.MEDIUM;
		this.time = TIME_MAP[new Date().getHours() as keyof typeof TIME_MAP];

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
		this.scene.gravity = new BABYLON.Vector3(0, -0.1, 0).scale(WORLD_SCALE);
		this.scene.collisionsEnabled = true;

		this.sr = new BABYLON.SnapshotRenderingHelper(this.scene);

		this.camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, cm(130), cm(0)), this.scene);
		this.camera.minZ = cm(1);
		this.camera.maxZ = cm(1000);
		this.camera.fov = 1;
		this.camera.ellipsoid = new BABYLON.Vector3(cm(15), cm(65), cm(15));
		this.camera.checkCollisions = true;
		this.camera.applyGravity = true;
		this.camera.needMoveForGravity = true;
		this.camera.inputs.clear();

		if (options.useVirtualJoystick) {
			this.camera.inputs.add(new FreeCameraManualInput(this.scene, {
				moveSensitivity: 0.015 * WORLD_SCALE,
				rotationSensitivity: 0.0007,
			}));
			this.camera.inertia = 0.75;
		} else {
			this.camera.inputs.add(new FreeCameraManualInput(this.scene, {
				moveSensitivity: 0.002 * WORLD_SCALE,
				rotationSensitivity: 0.0003,
			}));
		}

		this.scene.activeCamera = this.camera;

		this.fixedCamera = new BABYLON.FreeCamera('fixedCamera', new BABYLON.Vector3(0, cm(130), cm(0)), this.scene);
		this.fixedCamera.minZ = cm(1);
		this.fixedCamera.maxZ = cm(1000);
		this.fixedCamera.inputs.clear();

		this.lightContainer = new BABYLON.ClusteredLightContainer('clustered', [], this.scene);
		this.lightContainer.maxRange = cm(1000);
		this.lightContainer.verticalTiles = 32;
		this.lightContainer.horizontalTiles = 32;
		this.lightContainer.depthSlices = 32;

		if (this.useGlow) {
			this.gl = new BABYLON.GlowLayer('glow', this.scene, {
				//mainTextureFixedSize: 512,
				blurKernelSize: 64,
			});
			this.gl.intensity = 0.5;
			this.scene.setRenderingAutoClearDepthStencil(this.gl.renderingGroupId, false);

			this.sr.updateMeshesForEffectLayer(this.gl);
		}

		this.putParticleSystem = new BABYLON.ParticleSystem('', 64, this.scene);
		this.putParticleSystem.particleTexture = new BABYLON.Texture('/client-assets/room/steam.png');
		this.putParticleSystem.createCylinderEmitter(cm(5), cm(1), cm(5));
		this.putParticleSystem.minEmitBox = new BABYLON.Vector3(cm(-3), 0, cm(-3));
		this.putParticleSystem.maxEmitBox = new BABYLON.Vector3(cm(3), 0, cm(3));
		this.putParticleSystem.minEmitPower = cm(700);
		this.putParticleSystem.maxEmitPower = cm(1000);
		this.putParticleSystem.addVelocityGradient(0, 1);
		this.putParticleSystem.addVelocityGradient(1, 0);
		this.putParticleSystem.minLifeTime = 0.2;
		this.putParticleSystem.maxLifeTime = 0.2;
		this.putParticleSystem.minSize = cm(1);
		this.putParticleSystem.maxSize = cm(4);
		this.putParticleSystem.emitRate = 256;
		this.putParticleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
		this.putParticleSystem.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
		this.putParticleSystem.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
		this.putParticleSystem.colorDead = new BABYLON.Color4(1, 1, 1, 0);
		this.putParticleSystem.targetStopDuration = 0.05;

		this.gridPlane = BABYLON.MeshBuilder.CreatePlane('gridPlane', { width: cm(10000), height: cm(10000) }, this.scene);
		this.gridPlane.isPickable = false;
		this.gridPlane.isVisible = false;
		this.gridPlane.setEnabled(false);

		if (this.graphicsQuality >= GRAPHICS_QUALITY.MEDIUM) {
			this.selectionOutlineLayer = new BABYLON.SelectionOutlineLayer('outliner', this.scene);
			this.scene.setRenderingAutoClearDepthStencil(this.selectionOutlineLayer.renderingGroupId, false);
			this.sr.updateMeshesForEffectLayer(this.selectionOutlineLayer);
		}

		if (this.graphicsQuality >= GRAPHICS_QUALITY.HIGH) {
			const pipeline = new BABYLON.DefaultRenderingPipeline('default', true, this.scene);
			if (options.antialias) {
				pipeline.samples = 4;
			}

			// snapshot renderingと相性が悪そう
			//pipeline.depthOfFieldEnabled = true;
			//pipeline.depthOfField.focusDistance = 1500;
			//pipeline.depthOfField.focalLength = 20;
			//pipeline.depthOfField.fStop = 1.4;

			pipeline.bloomEnabled = true;
			pipeline.bloomThreshold = 0.95;
			pipeline.bloomWeight = 0.3;
			pipeline.bloomKernel = 256;
			pipeline.bloomScale = 2;

			//pipeline.chromaticAberrationEnabled = true;
			//pipeline.chromaticAberration.radialIntensity = 2;

			pipeline.sharpenEnabled = true;
			pipeline.sharpen.edgeAmount = 0.5;
		}

		if (_DEV_) {
			// snapshot renderingかつglow layerが有効だとなんかクラッシュする
			//import('@babylonjs/core/Debug/axesViewer').then(m => {
			//	const { AxesViewer } = m;
			//	const axes = new AxesViewer(this.scene, 30);
			//	axes.xAxis.position = new BABYLON.Vector3(0, 30, 0);
			//	axes.yAxis.position = new BABYLON.Vector3(0, 30, 0);
			//	axes.zAxis.position = new BABYLON.Vector3(0, 30, 0);
			//});
		}
	}

	private ev<K extends keyof RoomEngineEvents>(type: K, ctx: Parameters<RoomEngineEvents[K]>[0]) {
		this.emit('ev', { type, ctx });
	}

	public async init() {
		await this.loadEnv();

		const objects = this.roomState.installedObjects.filter(o => !IGNORE_OBJECTS.includes(o.type));
		let loadedCount = 0;

		if (this.roomState.worldScale !== WORLD_SCALE) {
			for (const o of objects) {
				o.position = [
					remap(o.position[0], 0, this.roomState.worldScale, 0, WORLD_SCALE),
					remap(o.position[1], 0, this.roomState.worldScale, 0, WORLD_SCALE),
					remap(o.position[2], 0, this.roomState.worldScale, 0, WORLD_SCALE),
				];
			}
			this.roomState.worldScale = WORLD_SCALE;
			this.ev('changeRoomState', { roomState: this.roomState });
		}

		await Promise.all(objects.map(o => this.loadObject({
			id: o.id,
			type: o.type,
			position: new BABYLON.Vector3(...o.position),
			rotation: new BABYLON.Vector3(o.rotation[0], o.rotation[1], o.rotation[2]),
			options: o.options,
		}).then(() => {
			loadedCount++;
			this.ev('loadingProgress', { progress: loadedCount / objects.length });
		})));

		// 不具合のもと
		//this.scene.blockMaterialDirtyMechanism = true;

		const box = BABYLON.MeshBuilder.CreateBox('', { size: cm(10) }, this.scene);
		// eslint-disable-next-line no-restricted-globals
		setInterval(() => {
			box.position = new BABYLON.Vector3(0, Math.random() * cm(10), 0);
		}, 10);

		this.startRenderLoop();

		await this.scene.whenReadyAsync();

		// 必ずシーンが少なくとも1フレームレンダリングがされてから呼ばれるように注意すること。そうしないとタイミングによってはエンジンがクラッシュする
		this.sr.enableSnapshotRendering();

		this.inputs.on('keydown', (ev) => {
			if (ev.code === 'KeyE') {
				if (this.isEditMode) {
					if (this.grabbingCtx != null) {
						this.endGrabbing();
					} else {
						this.beginSelectedInstalledObjectGrabbing();
					}
				} else if (this.selected != null) {
					this.interact(this.selected.objectId);
				}
			} else if (ev.code === 'KeyR') {
				if (this.grabbingCtx != null) {
					this.changeGrabbingRotation(Math.PI / 8);
				}
			} else if (ev.code === 'KeyQ') {
				if (this.isSitting) {
					this.standUp();
				}
			} else if (ev.code === 'Tab') {
				if (this.isEditMode) {
					this.exitEditMode();
				} else {
					this.enterEditMode();
				}
			}
		});

		this.inputs.on('wheel', (ev) => {
			if (this.grabbingCtx != null) {
				this.changeGrabbingDistance(ev.deltaY * 0.025);
			} else {
				this.camera.fov += ev.deltaY * 0.001;
				this.camera.fov = Math.max(0.25, Math.min(1, this.camera.fov));
			}
		});

		this.inputs.on('zoom', (ev) => {
			if (this.grabbingCtx != null) {
				this.changeGrabbingDistance(ev.delta * 0.1);
			} else {
				this.camera.fov += -ev.delta * 0.003;
				this.camera.fov = Math.max(0.25, Math.min(1, this.camera.fov));
			}
		});

		this.inputs.on('click', (ev) => {
			if (this.grabbingCtx != null) return;

			this.selectObject(null);

			// TODO: GPUPickerを使いたいが、なぜか一部のメッシュが反応しない
			const pickingInfo = this.scene.pick(ev.x, ev.y,
				(m) => m.name.includes('__PICK__') || (m.isVisible && m.isEnabled() && m.metadata?.objectId != null && this.objectEntities.has(m.metadata.objectId)));

			if (pickingInfo.pickedMesh != null) {
				const oid = pickingInfo.pickedMesh.metadata.objectId;
				if (oid != null && this.objectEntities.has(oid)) {
					const o = this.objectEntities.get(oid)!;
					const boundingInfo = getMeshesBoundingBox(o.rootMesh.getChildMeshes().filter(m => m.isEnabled() && m.isVisible && !m.isDisposed()), true);
					this.selectObject(oid);

					{ // camera animation
						const animTarget = new BABYLON.Animation(
							'',
							'target',
							60,
							BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
							BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
						);
						const keys = [
							{ frame: 0, value: this.camera.target.clone() },
							{ frame: 30, value: boundingInfo.center.clone() },
						];
						animTarget.setKeys(keys);
						const easing = new BABYLON.CubicEase();
						easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
						animTarget.setEasingFunction(easing);
						this.camera.animations.push(animTarget);
						this.scene.beginAnimation(this.camera, 0, 30, false, undefined, () => {
							// 視点が動くとアウトラインが薄くなるのでリセット (babylonのバグ？)
							this.sr.disableSnapshotRendering();
							this.sr.enableSnapshotRendering();
						});
					}
				}
			}
		});

		this.inputs.on('pointer', (ev) => {
			(this.camera.inputs.attached.manual as FreeCameraManualInput).setRotationVector({ x: ev.x, y: ev.y });
		});

		this.inited = true;
	}

	private currentRafId: number | null = null;

	private startRenderLoop() {
		if (this.fps == null) {
			this.engine.runRenderLoop(() => {
				this.scene.render();
			});
		} else {
			let then = 0;
			const interval = 1000 / this.fps;

			const renderLoop = (timeStamp: number) => {
				if (this.disposed) return;

				// workerで実行される可能性がある
				this.currentRafId = requestAnimationFrame(renderLoop);

				const delta = timeStamp - then;
				if (delta <= interval) return;
				then = timeStamp - (delta % interval);

				this.engine.beginFrame();
				this.scene.render();
				this.engine.endFrame();
			};

			// workerで実行される可能性がある
			this.currentRafId = requestAnimationFrame(renderLoop);
		}
	}

	public pauseRender() { // TODO: srと同じく参照カウント方式にした方が便利そう
		this.engine.stopRenderLoop();
		if (this.currentRafId != null) {
			// workerで実行される可能性がある
			cancelAnimationFrame(this.currentRafId);
			this.currentRafId = null;
		}
	}

	public resumeRender() {
		this.startRenderLoop();
	}

	// TODO: 初回以外で呼び出すとエンジンがクラッシュするのを修正
	public async changeEnvType(type: RoomState['env']['type'], forInit = false) {
		this.roomState.env.type = type;

		if (!forInit) {
			this.sr.disableSnapshotRendering();
			this.pauseRender();
		}

		const onMeshUpdatedCallback = (meshes: BABYLON.AbstractMesh[]) => {
			for (const m of meshes) {
				if (SYSTEM_HEYA_MESH_NAMES.some(name => m.name.includes(name))) {
					m.isPickable = false;
					m.receiveShadows = false;
					m.isVisible = false;
					m.checkCollisions = false;
					if (m.name.includes('__COLLISION__')) {
						m.checkCollisions = true;
					}
					continue;
				}

				m.isPickable = false;
				m.checkCollisions = false;
				if (m.material != null) {
					(m.material as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
				}
			}
		};

		let envManager: EnvManager;

		if (this.roomState.env.type === 'simple') {
			envManager = new SimpleEnvManager(this, onMeshUpdatedCallback);
		} else if (this.roomState.env.type === 'japanese') {
			envManager = new JapaneseEnvManager(this, onMeshUpdatedCallback);
		} else if (this.roomState.env.type === 'museum') {
			envManager = new MuseumEnvManager(this, onMeshUpdatedCallback);
		}

		await envManager.load(this.roomState.env.options);
		envManager.setTime(this.time);

		for (const mat of this.scene.materials) {
			mat.unfreeze();
			if (mat instanceof BABYLON.MultiMaterial) {
				for (const subMat of mat.subMaterials) {
					if (subMat.metadata?.useEnvMapAsObjectMaterial) subMat.reflectionTexture = envManager.envMapIndoor;
				}
			} else {
				if (mat.metadata?.useEnvMapAsObjectMaterial) mat.reflectionTexture = envManager.envMapIndoor;
			}
		}

		if (this.envManager != null) {
			this.envManager.dispose();
		}

		this.envManager = envManager;
		this.turnOnRoomLight(true);

		this.camera.maxZ = this.envManager.maxCameraZ;

		if (!forInit) {
			this.resumeRender();
			this.sr.enableSnapshotRendering();
		}

		if (!forInit) {
			this.ev('changeRoomState', { roomState: this.roomState });
		}
	}

	private async loadEnv() {
		await this.changeEnvType(this.roomState.env.type, true);
	}

	private async loadObject(args: {
		type: string;
		id: string;
		position: BABYLON.Vector3;
		rotation: BABYLON.Vector3;
		options: RawOptions;
	}) {
		const def = getObjectDef(args.type);

		const root = new BABYLON.TransformNode(`object_${args.id}_${args.type}`, this.scene);

		const filePath = def.path != null ? `/client-assets/room/objects/${def.path}.glb` : `/client-assets/room/objects/${camelToKebab(args.type)}/${camelToKebab(args.type)}.glb`;
		const loaderResult = await BABYLON.LoadAssetContainerAsync(filePath, this.scene);

		// babylonによって自動で追加される右手系変換用ノード
		let subRoot = loaderResult.meshes[0] as BABYLON.TransformNode;

		// 不要なUVを掃除
		if (!def.hasTexture) {
			for (const m of loaderResult.meshes) {
				if (m.geometry != null) {
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UVKind);
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UV2Kind);
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UV3Kind);
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UV4Kind);
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UV5Kind);
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UV6Kind);
				}
			}
		}

		if (def.canPreMeshesMerging) {
			const merged = mergeMeshes(loaderResult.meshes, subRoot, def.hasTexture);
			if (merged != null) {
				merged.setParent(subRoot);
				merged.name = 'preMerged';

				merged.material.freeze();
				if (merged.material instanceof BABYLON.MultiMaterial) {
					for (const subMat of merged.material.subMaterials) {
						subMat.freeze();
					}
				}

				// TODO: 再帰的にする
				for (const m of loaderResult.transformNodes) {
					if (m.getChildren().length === 0) {
						m.dispose();
					}
				}
			}
		}

		if (BAKE_TRANSFORM) {
			subRoot.scaling = new BABYLON.Vector3(1, 1, 1);
			subRoot.rotationQuaternion = null;
			subRoot.rotation = new BABYLON.Vector3(0, 0, 0);
			//subRoot.scaling = subRoot.scaling.scale(WORLD_SCALE);// cmをmに
			//subRoot.bakeCurrentTransformIntoVertices();
			//subRoot.bakeTransformIntoVertices(BABYLON.Matrix.Scaling(WORLD_SCALE, WORLD_SCALE, WORLD_SCALE));

			for (const m of loaderResult.transformNodes) {
				if (m.name === '__root__') continue;
				if (m.parent === subRoot) {
					m.setParent(root);
				//m.parent = root;
				}
			}
			for (const m of loaderResult.meshes) {
				if (m.name === '__root__') continue;
				if (m.parent === subRoot) {
					m.setParent(root);
				//m.parent = root;
				}
			}

			const bakeTransformNode = (m: BABYLON.TransformNode) => {
				m.position.x *= -WORLD_SCALE;
				m.position.y *= WORLD_SCALE;
				m.position.z *= WORLD_SCALE;
				m.rotation = m.rotationQuaternion.toEulerAngles();
				m.rotationQuaternion = null;
				//m.rotation.x = -m.rotation.x;
				m.rotation.y = -m.rotation.y;
				m.rotation.z = -m.rotation.z;
				for (const child of m.getChildren()) {
					if (child instanceof BABYLON.Mesh) {
					//child.scaling = child.scaling.scale(WORLD_SCALE);// cmをmに
					//child.position = child.position.scale(WORLD_SCALE);

						const pos = child.position.clone();
						const scaling = child.scaling.clone();
						child.scaling.x = -WORLD_SCALE;
						child.scaling.y = WORLD_SCALE;
						child.scaling.z = WORLD_SCALE;

						const rotation = child.rotationQuaternion ? child.rotationQuaternion.toEulerAngles() : child.rotation.clone();
						child.rotationQuaternion = null;
						child.position = new BABYLON.Vector3(0, 0, 0);

						child.parent = root;
						child.bakeCurrentTransformIntoVertices();
						child.parent = m;
						child.scaling = scaling;
						child.position.x = pos.x * -WORLD_SCALE;
						child.position.y = pos.y * WORLD_SCALE;
						child.position.z = pos.z * WORLD_SCALE;

						child.rotation = rotation;

						scaleMorph(child, [-WORLD_SCALE, WORLD_SCALE, WORLD_SCALE]);

					//const indices = child.getIndices();
					//const positions = child.getVerticesData(BABYLON.VertexBuffer.PositionKind);
					//const normals = child.getVerticesData(BABYLON.VertexBuffer.NormalKind);
					//BABYLON.VertexData.ComputeNormals(positions, indices, normals);
					//child.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals, false, false);
					} else if (child instanceof BABYLON.InstancedMesh) {
						const pos = child.position.clone();
						child.position.x = pos.x * -WORLD_SCALE;
						child.position.y = pos.y * WORLD_SCALE;
						child.position.z = pos.z * WORLD_SCALE;
					} else if (child instanceof BABYLON.TransformNode) {
						bakeTransformNode(child);
					}
				}
			};

			const bakeChildren = (node: BABYLON.Node) => {
				for (const m of node.getChildren(undefined, true)) {
					if (m instanceof BABYLON.Mesh) {
						const scaling = m.scaling.clone();
						m.scaling.x = -WORLD_SCALE;
						m.scaling.y = WORLD_SCALE;
						m.scaling.z = WORLD_SCALE;
						//m.position.x *= -WORLD_SCALE;
						//m.position.y *= WORLD_SCALE;
						//m.position.z *= WORLD_SCALE;
						const pos = m.position.clone();
						const rotation = m.rotationQuaternion.toEulerAngles();
						m.rotationQuaternion = null;
						m.rotation = new BABYLON.Vector3(0, 0, 0);
						m.position = new BABYLON.Vector3(0, 0, 0);
						m.bakeCurrentTransformIntoVertices();
						m.scaling.x = scaling.x;
						m.scaling.y = scaling.y;
						m.scaling.z = scaling.z;
						m.position.x = pos.x * -WORLD_SCALE;
						m.position.y = pos.y * WORLD_SCALE;
						m.position.z = pos.z * WORLD_SCALE;
						m.rotation = rotation;
						//m.rotation.x = -m.rotation.x;
						m.rotation.y = -m.rotation.y;
						m.rotation.z = -m.rotation.z;

						scaleMorph(m, [-WORLD_SCALE, WORLD_SCALE, WORLD_SCALE]);
					} else if (m instanceof BABYLON.InstancedMesh) {
					//const pos = m.position.clone();
					//m.position.x = pos.x * -WORLD_SCALE;
					//m.position.y = pos.y * WORLD_SCALE;
					//m.position.z = pos.z * WORLD_SCALE;
						m.position.x *= -WORLD_SCALE;
						m.position.y *= WORLD_SCALE;
						m.position.z *= WORLD_SCALE;
						m.rotation = m.rotationQuaternion.toEulerAngles();
						m.rotationQuaternion = null;
						m.rotation.x = -m.rotation.x;
						m.rotation.y = -m.rotation.y;
						m.rotation.z = -m.rotation.z;
					} else if (m instanceof BABYLON.TransformNode) {
						bakeTransformNode(m);
					}
				}
			};

			bakeChildren(root);

			subRoot.dispose();
		} else {
			// meshじゃなくtransform nodeにしてパフォーマンス向上
			const _subRoot = new BABYLON.TransformNode('__root__', this.scene);
			_subRoot.scaling.x = -1;
			_subRoot.scaling = _subRoot.scaling.scale(WORLD_SCALE);// cmをmに

			for (const m of subRoot.getChildren()) {
				if (m.parent === subRoot) {
					m.parent = _subRoot;
				}
			}

			subRoot.dispose();
			subRoot = _subRoot;
		}

		def.treatLoaderResult?.(loaderResult);

		const metadata = {
			isObject: true,
			objectId: args.id,
			objectType: args.type,
		};

		if (!BAKE_TRANSFORM) {
			root.addChild(subRoot);
		}

		root.position = args.position.clone();
		root.rotation = args.rotation.clone();
		root.metadata = metadata;

		const model = new ModelManager(BAKE_TRANSFORM ? root : subRoot, loaderResult.meshes.filter(m => !m.isDisposed() && m.name !== '__root__'), def.hasTexture, (meshes) => {
			if (this.selected?.objectId === args.id) {
				this.highlightMeshes(meshes);
			}

			for (const mesh of meshes) {
				// シェイプキー(morph)を考慮してbounding boxを更新するために必要
				mesh.refreshBoundingInfo({ applyMorph: true });

				mesh.metadata = metadata;

				if (SYSTEM_MESH_NAMES.some(n => mesh.name.includes(n))) {
					mesh.receiveShadows = false;
					mesh.isVisible = false;
				} else {
					if (def.receiveShadows !== false) mesh.receiveShadows = true;
					if (def.castShadows !== false) {
						// TODO: メモリリークしそうだからいい感じにする
						this.envManager.addShadowCaster(mesh);
					}

					//if (mesh.material) (mesh.material as BABYLON.PBRMaterial).ambientColor = new BABYLON.Color3(0.2, 0.2, 0.2);
					if (mesh.material) {
						if (mesh.material instanceof BABYLON.MultiMaterial) {
							for (const subMat of mesh.material.subMaterials) {
								if ((subMat as BABYLON.PBRMaterial).subSurface.isRefractionEnabled) {
									(subMat as BABYLON.PBRMaterial).subSurface.isRefractionEnabled = false; // 有効にするとドローコールが激増する(babylonのバグか仕様かは不明)
									(subMat as BABYLON.PBRMaterial).transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
								}
								(subMat as BABYLON.PBRMaterial).reflectionTexture = this.envManager?.envMapIndoor;
								if ((subMat as BABYLON.PBRMaterial).metadata == null) (subMat as BABYLON.PBRMaterial).metadata = {};
								(subMat as BABYLON.PBRMaterial).metadata.useEnvMapAsObjectMaterial = true;
								(subMat as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
								(subMat as BABYLON.PBRMaterial).anisotropy.isEnabled = false; // なんかきれいにレンダリングされないため
							}
						} else {
							if ((mesh.material as BABYLON.PBRMaterial).subSurface.isRefractionEnabled) {
								(mesh.material as BABYLON.PBRMaterial).subSurface.isRefractionEnabled = false; // 有効にするとドローコールが激増する(babylonのバグか仕様かは不明)
								(mesh.material as BABYLON.PBRMaterial).transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
							}
							(mesh.material as BABYLON.PBRMaterial).reflectionTexture = this.envManager?.envMapIndoor;
							if ((mesh.material as BABYLON.PBRMaterial).metadata == null) (mesh.material as BABYLON.PBRMaterial).metadata = {};
							(mesh.material as BABYLON.PBRMaterial).metadata.useEnvMapAsObjectMaterial = true;
							(mesh.material as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
							(mesh.material as BABYLON.PBRMaterial).anisotropy.isEnabled = false; // なんかきれいにレンダリングされないため
						}
					}
				}

				if (!this.scene.meshes.includes(mesh)) this.scene.addMesh(mesh);
			}

			if (def.hasCollisions) {
				enableObjectCollision(meshes);
			}

			/* なんかバグる
			for (const mesh of meshes) {
				if (mesh.checkCollisions || SYSTEM_MESH_NAMES.some(n => mesh.name.includes(n))) continue;

				// コリジョンや(ray) pickingに使わないメッシュの頂点情報はCPU側に保持しておく必要がない(通常のpickingはGPUPickerを使えるのでCPUは関与しない)
				mesh.geometry.clearCachedData();
			}
			*/
		});

		const convertedOptions = convertRawOptions(def.options.schema, args.options, this.roomAttachments);

		const objectInstance = await def.createInstance({
			scene: this.scene,
			sr: {
				updateMesh: (mesh) => {
					if (!this.inited) return;
					this.sr.updateMesh(mesh);
				},
				reset: () => {
					if (!this.inited) return;
					this.sr.disableSnapshotRendering();
					this.sr.enableSnapshotRendering();
				},
				fixParticleSystem: (ps) => this.sr.fixParticleSystem(ps),
			},
			lc: this.lightContainer,
			root,
			options: convertedOptions,
			model,
			id: args.id,
			timer: this.timer, // TODO: 家具が撤去された後も動作し続けるのをどうにかする
			graphicsQuality: this.graphicsQuality,
			stickyMarkerMeshUpdated: (mesh) => {
				// TODO
				//// stickyな子の位置を更新
				//if (mesh.name.includes('__TOP__')) {
				//	mesh.unfreezeWorldMatrix();
				//	mesh.computeWorldMatrix(true);
				//	const updateChildStickyObjectPosition = (objectId: string) => {
				//		const stickyObjectIds = Array.from(this.roomState.installedObjects.filter(o => o.sticky === objectId)).map(o => o.id);
				//		for (const soid of stickyObjectIds) {
				//			const soMesh = this.objectEntities.get(soid)!.rootMesh;
				//			soMesh.unfreezeWorldMatrix();
				//			for (const m of soMesh.getChildMeshes()) {
				//				m.unfreezeWorldMatrix();
				//			}
				//			console.log(mesh.getAbsolutePosition().y);
				//			soMesh.position.y = mesh.getAbsolutePosition().y;
				//			updateChildStickyObjectPosition(soid);
				//		}
				//	};
				//	updateChildStickyObjectPosition(args.id);
				//}
			},
		});

		objectInstance.onInited?.();

		model.bakeMesh();

		if (def.hasCollisions) {
			enableObjectCollision(root.getChildMeshes());
		}

		this.objectEntities.set(args.id, { convertedOptions, instance: objectInstance, rootMesh: root, model });

		return { root, objectInstance };
	}

	public cameraMove(vector: { x: number; y: number; }, dash: boolean) {
		(this.camera.inputs.attached.manual as FreeCameraManualInput).setMoveVector(dash ? { x: vector.x * 3, y: vector.y * 3 } : vector);
	}

	public cameraRotate(vector: { x: number; y: number; }) {
		(this.camera.inputs.attached.manual as FreeCameraManualInput).setRotationVector(vector);
	}

	public cameraJoystickMove(vector: { x: number; y: number; }) {
		(this.camera.inputs.attached.manual as FreeCameraManualInput).setMoveVector(vector);
	}

	public selectObject(objectId: string | null) {
		this.sr.disableSnapshotRendering(); // snapshot rendering中にbake/unbakeするとエラーになる。なおこのメソッドは参照カウント方式な点に留意

		const currentSelected = this.selected;
		if (currentSelected != null) {
			this.selected = null;
			this.clearHighlight();
			currentSelected.objectEntity.model.bakeMesh();
		}

		if (objectId != null) {
			const entity = this.objectEntities.get(objectId);
			if (entity != null) {
				entity.model.unbakeMesh();
				this.highlightMeshes(entity.rootMesh.getChildMeshes());
				const state = this.roomState.installedObjects.find(o => o.id === objectId)!;
				this.selected = {
					objectId,
					objectEntity: entity,
					objectState: state,
					objectDef: getObjectDef(state.type),
				};
			}
		}

		this.sr.enableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
	}

	private previousGridPlanePosition: BABYLON.Vector3 | null = null;

	private handleGrabbing() {
		if (this.grabbingCtx == null) return;
		const grabbing = this.grabbingCtx;

		const placement = getObjectDef(grabbing.objectType).placement;

		const dir = this.camera.getDirection(BABYLON.Axis.Z).scale(this.scene.useRightHandedSystem ? -1 : 1);
		let newPos = this.camera.position.add(dir.scale(grabbing.distance)).add(grabbing.originalDiffOfPosition);
		const newRotation = new BABYLON.Vector3(0, this.camera.rotation.y + grabbing.originalDiffOfRotation.y + grabbing.rotation, 0);
		grabbing.ghost.position = newPos.clone();
		const arrowMesh = grabbing.ghost.getChildMeshes()[0];
		if (placement === 'side' || placement === 'wall') {
			arrowMesh.isVisible = false;
		} else if (placement === 'bottom' || placement === 'ceiling') {
			arrowMesh.scaling = new BABYLON.Vector3(1, 1, 1);
		} else if (placement === 'top' || placement === 'floor') {
			arrowMesh.scaling = new BABYLON.Vector3(1, -1, 1);
		}
		this.sr.updateMesh(arrowMesh);

		let stickyOtherObject: string | null = null;
		let sticky = false;

		const isCollisionTarget = (m: BABYLON.AbstractMesh) => {
			return m.metadata?.objectId !== grabbing.objectId &&
				!m.metadata?.isGhost &&
				!grabbing.descendantStickyObjectIds.includes(m.metadata?.objectId);
		};

		const pos = new BABYLON.Vector3(this.camera.position.x, this.camera.position.y, this.camera.position.z);
		const _dir = newPos.subtract(pos).normalize();
		for (let i = 0; i < 1000; i++) {
			if (cm(i) > grabbing.distance) break;
			const prevSticky = sticky;
			// posを1cmずつnewPosの方向に動かす
			pos.addInPlace(_dir.scale(cm(1)));

			if (placement === 'side' || placement === 'wall') {
				// 前方に向かってレイを飛ばす
				const ray = new BABYLON.Ray(pos, dir, cm(1000));
				const hit = placement === 'side' ? this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_WALL__') || m.name.includes('__SIDE__'))) : this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_WALL__')));
				if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
					sticky = true;
					const pickedMeshNormal = hit.getNormal(true, true)!;
					const targetRotationY = Math.atan2(pickedMeshNormal.x, pickedMeshNormal.z);
					newRotation.y = targetRotationY;
					newRotation.z = grabbing.originalDiffOfRotation.z + grabbing.rotation;
					newPos = hit.pickedPoint;
					stickyOtherObject = hit.pickedMesh.metadata?.objectId ?? null;

					if (this.gridSnapping.enabled) {
						newPos.y = Math.round(newPos.y / this.gridSnapping.scale) * this.gridSnapping.scale;
						if (getYRotationDirection(targetRotationY) === '+x' || getYRotationDirection(targetRotationY) === '-x') {
							newPos.z = Math.round(newPos.z / this.gridSnapping.scale) * this.gridSnapping.scale;
						} else {
							newPos.x = Math.round(newPos.x / this.gridSnapping.scale) * this.gridSnapping.scale;
						}

						this.gridPlane.rotationQuaternion = null;
						this.gridPlane.rotation.x = Math.PI;
						this.gridPlane.rotation.y = targetRotationY;
						this.gridPlane.position = newPos.add(pickedMeshNormal.scale(cm(0.1)));
						if (getYRotationDirection(targetRotationY) === '+x' || getYRotationDirection(targetRotationY) === '-x') {
							this.gridPlane.position.y = 0;
							this.gridPlane.position.z = 0;
						} else {
							this.gridPlane.position.y = 0;
							this.gridPlane.position.x = 0;
						}
					}
				}
			} else if (placement === 'bottom' || placement === 'ceiling') {
				// 上に向かってレイを飛ばす
				const ray = new BABYLON.Ray(pos, new BABYLON.Vector3(0, 1, 0), cm(1000));
				const hit = placement === 'bottom' ? this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_CEILING__') || m.name.includes('__ROOM_BOTTOM__') || m.name.includes('__BOTTOM__'))) : this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_CEILING__')));
				if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
					sticky = true;
					newPos = hit.pickedPoint;
					stickyOtherObject = hit.pickedMesh.metadata?.objectId ?? null;

					if (this.gridSnapping.enabled) {
						newPos.x = Math.round(newPos.x / this.gridSnapping.scale) * this.gridSnapping.scale;
						newPos.z = Math.round(newPos.z / this.gridSnapping.scale) * this.gridSnapping.scale;

						this.gridPlane.rotationQuaternion = null;
						this.gridPlane.rotation.x = Math.PI * 1.5;
						this.gridPlane.rotation.y = 0;
						this.gridPlane.position = new BABYLON.Vector3(grabbing.mesh.position.x, grabbing.mesh.position.y - cm(0.1), grabbing.mesh.position.z);
						this.gridPlane.position.x = 0;
						this.gridPlane.position.z = 0;
					}
				}
			} else { // top or floor
				// 下に向かってレイを飛ばす
				const ray = new BABYLON.Ray(pos, new BABYLON.Vector3(0, -1, 0), cm(1000));
				const hit = placement === 'top' ? this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_FLOOR__') || m.name.includes('__ROOM_TOP__') || m.name.includes('__TOP__'))) : this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_FLOOR__')));
				if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
					sticky = true;
					newPos = hit.pickedPoint;
					stickyOtherObject = hit.pickedMesh.metadata?.objectId ?? null;

					if (this.gridSnapping.enabled) {
						newPos.x = Math.round(newPos.x / this.gridSnapping.scale) * this.gridSnapping.scale;
						newPos.z = Math.round(newPos.z / this.gridSnapping.scale) * this.gridSnapping.scale;

						this.gridPlane.rotationQuaternion = null;
						this.gridPlane.rotation.x = Math.PI / 2;
						this.gridPlane.rotation.y = 0;
						this.gridPlane.position = new BABYLON.Vector3(grabbing.mesh.position.x, grabbing.mesh.position.y + cm(0.1), grabbing.mesh.position.z);
						this.gridPlane.position.x = 0;
						this.gridPlane.position.z = 0;
					}
				}
			}

			if (!sticky && prevSticky) {
				sticky = true;
				break;
			}
		}

		if (sticky) {
			if (this.gridSnapping.enabled) {
				newRotation.y = Math.round(newRotation.y / (Math.PI / 8)) * (Math.PI / 8);
			}

			grabbing.mesh.position = newPos;
			grabbing.mesh.rotation = newRotation;

			this.sr.updateMesh(grabbing.mesh.getChildMeshes());
		}

		// 浮動小数点数のわずかな誤差が出るため0.01cm以下の変動は無視する
		const gridPlaneUpdated = this.previousGridPlanePosition == null || (
			Math.abs(this.previousGridPlanePosition.x - this.gridPlane.position.x) > cm(0.01) ||
			Math.abs(this.previousGridPlanePosition.y - this.gridPlane.position.y) > cm(0.01) ||
			Math.abs(this.previousGridPlanePosition.z - this.gridPlane.position.z) > cm(0.01)
		);

		if (gridPlaneUpdated) {
			// おそらくGridMaterialの都合上updateMeshでは不十分
			//this.sr.updateMesh(this.gridPlane);
			this.sr.disableSnapshotRendering();
			this.sr.enableSnapshotRendering();
		}

		this.previousGridPlanePosition = this.gridPlane.position.clone();

		grabbing.onMove?.({
			position: newPos,
			rotation: newRotation,
			sticky: stickyOtherObject,
		});
	}

	private highlightMeshes(meshes: BABYLON.AbstractMesh[]) {
		if (this.selectionOutlineLayer == null) return;

		//if (this.engine.snapshotRendering) return; // snapshot rendering内でそのままやろうとするとエラーになる 回避実装もめんどいので単に無視
		this.sr.disableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
		this.clearHighlight();
		this.selectionOutlineLayer.addSelection(meshes);
		this.sr.enableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
	}

	private clearHighlight() {
		if (this.selectionOutlineLayer == null) return;

		//if (this.engine.snapshotRendering) return; // snapshot rendering内でそのままやろうとするとエラーになる 回避実装もめんどいので単に無視
		this.sr.disableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
		this.selectionOutlineLayer.clearSelection();
		this.sr.enableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
	}

	public beginSelectedInstalledObjectGrabbing() {
		if (this.selected == null) return;

		this.sr.disableSnapshotRendering();

		const selectedObject = this.selected.objectEntity.rootMesh;
		this.clearHighlight();

		const initialPosition = selectedObject.position.clone();
		const initialRotation = selectedObject.rotation.clone();

		// 子から先に適用していく
		const setStickyParentRecursively = (mesh: BABYLON.AbstractMesh) => {
			const stickyObjectIds = Array.from(this.roomState.installedObjects.filter(o => o.sticky === mesh.metadata.objectId)).map(o => o.id);
			for (const soid of stickyObjectIds) {
				const soMesh = this.objectEntities.get(soid)!.rootMesh;
				setStickyParentRecursively(soMesh);
				soMesh.setParent(mesh);
				soMesh.unfreezeWorldMatrix();
				for (const m of soMesh.getChildMeshes()) {
					m.unfreezeWorldMatrix();
				}
			}
		};
		setStickyParentRecursively(selectedObject);

		const descendantStickyObjectIds: string[] = [];
		const collectDescendantStickyObjectIds = (parentId: string) => {
			const childIds = Array.from(this.roomState.installedObjects.filter(o => o.sticky === parentId)).map(o => o.id);
			for (const cid of childIds) {
				descendantStickyObjectIds.push(cid);
				collectDescendantStickyObjectIds(cid);
			}
		};
		collectDescendantStickyObjectIds(selectedObject.metadata.objectId);

		const placement = getObjectDef(selectedObject.metadata.objectType).placement;

		if (placement === 'top') {
			// stickyな場合にsticky先とのレイの距離が0になりstickyされていない初期状態でgrabbingが始まってしまうのでちょっと浮かす
			selectedObject.position.y += cm(1);
		}

		const distance = BABYLON.Vector3.Distance(this.camera.position, selectedObject.position);
		const ghost = this.createGhost(selectedObject);

		const dir = this.camera.getDirection(BABYLON.Axis.Z).scale(this.scene.useRightHandedSystem ? -1 : 1);

		let sticky: string | null;
		let grabbingEnded = false;

		this.grabbingCtx = {
			objectId: selectedObject.metadata.objectId,
			objectType: selectedObject.metadata.objectType,
			forInstall: false,
			mesh: selectedObject,
			originalDiffOfPosition: selectedObject.position.subtract(this.camera.position.add(dir.scale(distance))),
			originalDiffOfRotation: selectedObject.rotation.subtract(this.camera.rotation),
			distance: distance,
			rotation: 0,
			ghost: ghost,
			descendantStickyObjectIds,
			onMove: (info) => {
				sticky = info.sticky;
			},
			onCancel: () => {
				grabbingEnded = true;
				this.sr.disableSnapshotRendering();
				selectedObject.position = initialPosition.clone();
				selectedObject.rotation = initialRotation.clone();

				// 親から先に外していく
				const removeStickyParentRecursively = (mesh: BABYLON.Mesh) => {
					const stickyObjectIds = Array.from(this.roomState.installedObjects.filter(o => o.sticky === mesh.metadata.objectId)).map(o => o.id);
					for (const soid of stickyObjectIds) {
						const soMesh = this.objectEntities.get(soid)!.rootMesh;
						soMesh.setParent(null);

						removeStickyParentRecursively(soMesh);
					}
				};
				removeStickyParentRecursively(selectedObject);
				this.sr.enableSnapshotRendering();
			},
			onDone: () => { // todo: sticky状態などを引数でもらうようにしたい
				grabbingEnded = true;
				this.putParticleSystem.emitter = selectedObject.position.clone();
				this.putParticleSystem.start();

				this.playSfxUrl('/client-assets/room/sfx/put.mp3', {
					volume: 1,
					playbackRate: 1,
				});

				this.sr.disableSnapshotRendering();

				// put animation
				const animTarget = new BABYLON.Animation(
					'',
					'scaling',
					60,
					BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
					BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
				);
				const keys = [
					{ frame: 0, value: new BABYLON.Vector3(1, 1.2, 1) },
					{ frame: 60, value: new BABYLON.Vector3(1, 1, 1) },
				];
				animTarget.setKeys(keys);
				const easing = new BABYLON.ElasticEase(2);
				easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
				animTarget.setEasingFunction(easing);
				selectedObject.animations.push(animTarget);
				const animating = Promise.withResolvers<void>();
				this.scene.beginAnimation(selectedObject, 0, 60, false, 3, () => { animating.resolve(); });
				this.sr.enableSnapshotRendering();

				// TODO: アニメーションの完了まで親子関係の解除を遅延するため、一瞬「grabbingが終わっているのに親子関係が解除されていない」状態が発生する。その間に新たにgrabbingを開始するなどの別の操作が発生すると不具合のもとになるのでそれを防止する仕組みを作る
				animating.promise.then(() => {
					this.sr.disableSnapshotRendering();
					// 親から先に外していく
					const removeStickyParentRecursively = (mesh: BABYLON.Mesh) => {
						const stickyObjectIds = Array.from(this.roomState.installedObjects.filter(o => o.sticky === mesh.metadata.objectId)).map(o => o.id);
						for (const soid of stickyObjectIds) {
							const soMesh = this.objectEntities.get(soid)!.rootMesh;
							soMesh.setParent(null);

							const pos = soMesh.position.clone();
							const rotation = soMesh.rotation.clone();
							this.roomState.installedObjects.find(o => o.id === soid)!.position = [pos.x, pos.y, pos.z];
							this.roomState.installedObjects.find(o => o.id === soid)!.rotation = [rotation.x, rotation.y, rotation.z];

							removeStickyParentRecursively(soMesh);
						}
					};
					removeStickyParentRecursively(selectedObject);

					this.sr.enableSnapshotRendering();

					const pos = selectedObject.position.clone();
					const rotation = selectedObject.rotation.clone();
					this.roomState.installedObjects.find(o => o.id === selectedObject.metadata.objectId)!.sticky = sticky;
					this.roomState.installedObjects.find(o => o.id === selectedObject.metadata.objectId)!.position = [pos.x, pos.y, pos.z];
					this.roomState.installedObjects.find(o => o.id === selectedObject.metadata.objectId)!.rotation = [rotation.x, rotation.y, rotation.z];

					this.ev('changeRoomState', { roomState: this.roomState });
				});
			},
		};

		this.gridPlane.isVisible = true;

		this.sr.enableSnapshotRendering();

		const stopHandleGrabbing = this.timer.setInterval(() => {
			if (grabbingEnded) {
				stopHandleGrabbing();
				return;
			}
			this.handleGrabbing();
		}, 10);

		this.playSfxUrl('/client-assets/room/sfx/grab.mp3', {
			volume: 1,
			playbackRate: 1,
		});
	}

	public endGrabbing(cancel = false) {
		if (this.grabbingCtx == null) return;

		this.sr.disableSnapshotRendering();
		// 一度に子までdisposeしようとするとなぜか照明系の家具の場合エンジンがクラッシュする(消しちゃまずいものが子に混じっている？)ので、まず子からちびちび消していく
		//this.grabbingCtx.ghost.dispose(false, false);
		for (const m of this.grabbingCtx.ghost.getChildMeshes()) {
			m.dispose(true, false);
		}
		this.grabbingCtx.ghost.dispose(true, false);
		this.gridPlane.isVisible = false;
		this.sr.enableSnapshotRendering();

		if (cancel) {
			this.grabbingCtx.onCancel?.();
		} else {
			this.grabbingCtx.onDone?.();
		}
		this.grabbingCtx = null;
	}

	public interact(oid: string) {
		const o = this.roomState.installedObjects.find(o => o.id === oid)!;
		const objDef = getObjectDef(o.type);
		const entity = this.objectEntities.get(o.id)!;

		if (objDef.isChair) {
			this.sitChair(o.id);
		} else {
			if (entity.instance.primaryInteraction != null) {
				entity.instance.interactions[entity.instance.primaryInteraction].fn();
			}
		}
	}

	public sitChair(objectId: string) {
		this.isSitting = true;
		this.fixedCamera.parent = this.objectEntities.get(objectId)!.rootMesh;
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

	public updateRoomLightColor(color: [number, number, number]) {
		this.envManager.updateRoomLightColor(new BABYLON.Color3(...color));
		this.roomState.roomLightColor = color;
		this.ev('changeRoomState', { roomState: this.roomState });
	}

	public turnOnRoomLight(forInit = false) {
		if (!forInit) this.sr.disableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
		this.envManager.turnOnRoomLight();
		if (!forInit) {
			// workerで実行される可能性がある
			// eslint-disable-next-line no-restricted-globals
			setTimeout(() => {
				this.sr.enableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
			}, 10);
		}
	}

	public turnOffRoomLight() {
		this.sr.disableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
		this.envManager.turnOffRoomLight();
		// workerで実行される可能性がある
		// eslint-disable-next-line no-restricted-globals
		setTimeout(() => {
			this.sr.enableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
		}, 10);
	}

	private createGhost(mesh: BABYLON.Mesh): BABYLON.TransformNode {
		const root = new BABYLON.TransformNode('ghost_root', this.scene);

		const arrowGhost = BABYLON.MeshBuilder.CreateCylinder('', { height: cm(10), diameterBottom: cm(5), diameterTop: 0, tessellation: 8 });
		arrowGhost.parent = root;
		const arrowGhostMat = new BABYLON.StandardMaterial('', this.scene);
		arrowGhostMat.emissiveColor = new BABYLON.Color3(0, 1, 0);
		arrowGhostMat.alpha = 0.5;
		arrowGhostMat.disableLighting = true;
		arrowGhost.material = arrowGhostMat;

		return root;
	}

	public async addObject(type: string, _options?: RawOptions, attachments?: RoomAttachments) {
		if (!this.isEditMode) return;
		if (this.grabbingCtx != null) return;

		if (attachments != null) {
			this.roomAttachments = attachments;
		}

		this.selectObject(null);

		const dir = this.camera.getDirection(BABYLON.Axis.Z).scale(this.scene.useRightHandedSystem ? -1 : 1);
		const distance = cm(50);

		const id = genId();

		const def = getObjectDef(type);

		const options = _options != null ? deepClone(_options) : deepClone(def.options.default);

		const { root } = await this.loadObject({
			id: id,
			type,
			position: new BABYLON.Vector3(0, 0, 0),
			rotation: new BABYLON.Vector3(0, Math.PI, 0),
			options,
		});

		root.unfreezeWorldMatrix();
		for (const m of root.getChildMeshes()) {
			m.unfreezeWorldMatrix();
			m.checkCollisions = false;
		}

		const ghost = this.createGhost(root);

		let sticky: string | null;
		let grabbingEnded = false;

		this.grabbingCtx = {
			objectId: id,
			objectType: type,
			forInstall: true,
			mesh: root,
			originalDiffOfPosition: new BABYLON.Vector3(0, 0, 0),
			originalDiffOfRotation: new BABYLON.Vector3(0, Math.PI, 0),
			distance: distance,
			rotation: 0,
			ghost: ghost,
			descendantStickyObjectIds: [],
			onMove: (info) => {
				sticky = info.sticky;
			},
			onCancel: () => {
				grabbingEnded = true;
				// todo
			},
			onDone: () => { // todo: sticky状態などを引数でもらうようにしたい
				grabbingEnded = true;

				if (def.hasCollisions) {
					enableObjectCollision(root.getChildMeshes());
				}

				const pos = root.position.clone();
				const rotation = root.rotation.clone();

				this.putParticleSystem.emitter = pos;
				this.putParticleSystem.start();

				this.playSfxUrl('/client-assets/room/sfx/put.mp3', {
					volume: 1,
					playbackRate: 1,
				});

				this.sr.disableSnapshotRendering();

				// put animation
				const animTarget = new BABYLON.Animation(
					'',
					'scaling',
					60,
					BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
					BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
				);
				const keys = [
					{ frame: 0, value: new BABYLON.Vector3(1, 1.2, 1) },
					{ frame: 60, value: new BABYLON.Vector3(1, 1, 1) },
				];
				animTarget.setKeys(keys);
				const easing = new BABYLON.ElasticEase(2);
				easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
				animTarget.setEasingFunction(easing);
				root.animations.push(animTarget);
				this.scene.beginAnimation(root, 0, 60, false, 3);

				this.sr.enableSnapshotRendering();

				this.roomState.installedObjects.push({
					id,
					type,
					position: [pos.x, pos.y, pos.z],
					rotation: [rotation.x, rotation.y, rotation.z],
					sticky,
					options,
				});

				this.ev('changeRoomState', { roomState: this.roomState });
			},
		};

		this.sr.disableSnapshotRendering();
		this.gridPlane.isVisible = true;
		this.sr.enableSnapshotRendering();

		const stopHandleGrabbing = this.timer.setInterval(() => {
			if (grabbingEnded) {
				stopHandleGrabbing();
				return;
			}
			this.handleGrabbing();
		}, 10);

		this.playSfxUrl('/client-assets/room/sfx/grab.mp3', {
			volume: 1,
			playbackRate: 1,
		});
	}

	public enterEditMode() {
		this.isEditMode = true;

		for (const entity of this.objectEntities.values()) {
			entity.instance.resetTemporaryState?.();
		}

		//if (this.gl != null) {
		//	this.gl.isEnabled = false; // 重いので切る
		//}

		if (this.gridPlane.material == null) {
			import('@babylonjs/materials').then(m => {
				this.sr.disableSnapshotRendering();

				this.gridMaterial = new m.GridMaterial('grid', this.scene);
				this.gridMaterial.lineColor = new BABYLON.Color3(0.5, 0.5, 0.5);
				this.gridMaterial.mainColor = new BABYLON.Color3(0, 0, 0);
				this.gridMaterial.majorUnitFrequency = 10;
				this.gridMaterial.minorUnitVisibility = 0.3;
				this.gridMaterial.opacity = 0.5;
				this.gridMaterial.gridRatio = this.gridSnapping.scale;
				this.gridMaterial.backFaceCulling = false;

				this.gridPlane.material = this.gridMaterial;
				this.gridPlane.setEnabled(true);

				this.sr.enableSnapshotRendering();
			});
		}
	}

	public async exitEditMode() {
		this.selectObject(null);
		this.isEditMode = false;

		await this.bake();

		//if (this.gl != null) {
		//	this.gl.isEnabled = true;
		//}
	}

	public async bake() {
		/*
		const reflectionProbe = new BABYLON.ReflectionProbe('', 256, this.scene, true, true, true);
		reflectionProbe.position = new BABYLON.Vector3(0, 150, 0);
		reflectionProbe.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
		reflectionProbe.renderList = this.scene.meshes.filter(m => (m instanceof BABYLON.Mesh || m instanceof BABYLON.InstancedMesh) && m.isEnabled() && m.isVisible && m.material);
		this.scene.customRenderTargets.push(reflectionProbe.cubeTexture);
		reflectionProbe.cubeTexture.render();

		// workerで実行される可能性がある
		// eslint-disable-next-line no-restricted-globals
		await new Promise(res => setTimeout(res, 2000));

		const tex = reflectionProbe.cubeTexture;
		reflectionProbe.renderList = [];

		const sphere = BABYLON.MeshBuilder.CreateSphere('', { diameter: 50 }, this.scene);
		sphere.position = new BABYLON.Vector3(0, 100, 0);
		const mat = new BABYLON.PBRMaterial('', this.scene);
		mat.metallic = 1;
		mat.roughness = 0;
		mat.reflectionTexture = tex;
		sphere.material = mat;

		reflectionProbe.renderList = [];
		//reflectionProbe.dispose();

		for (const mesh of this.scene.meshes.filter(m => (m instanceof BABYLON.Mesh || m instanceof BABYLON.InstancedMesh) && m.isEnabled() && m.isVisible && m.material && m.metadata?.isObject)) {
			if (mesh.material) {
				mesh.material.unfreeze();
				if (mesh.material instanceof BABYLON.MultiMaterial) {
					for (const subMat of mesh.material.subMaterials) {
						subMat.unfreeze();
						(subMat as BABYLON.PBRMaterial).reflectionTexture = tex;
						(subMat as BABYLON.PBRMaterial).realTimeFiltering = true;
					}
				} else {
					(mesh.material as BABYLON.PBRMaterial).reflectionTexture = tex;
					(mesh.material as BABYLON.PBRMaterial).realTimeFiltering = true;
				}
			}
		}
			*/
	}

	public removeSelectedObject() {
		if (this.selected == null) return;

		const objectId = this.selected.objectId;

		this.objectEntities.get(objectId)?.rootMesh.dispose();
		this.objectEntities.delete(objectId);
		this.roomState.installedObjects = this.roomState.installedObjects.filter(o => o.id !== objectId);
		for (const o of this.roomState.installedObjects.filter(o => o.sticky === objectId)) {
			o.sticky = null;
		}
		this.ev('changeRoomState', { roomState: this.roomState });
		this.selected = null;

		this.playSfxUrl('/client-assets/room/sfx/remove.mp3', {
			volume: 1,
			playbackRate: 1,
		});
	}

	public changeGrabbingDistance(delta: number) {
		if (this.grabbingCtx == null) return;
		this.grabbingCtx.distance -= cm(delta);
		if (this.grabbingCtx.distance < cm(5)) this.grabbingCtx.distance = cm(5);
	}

	public changeGrabbingRotation(delta: number) {
		if (this.grabbingCtx == null) return;
		this.grabbingCtx.rotation += delta;
	}

	public updateObjectOption(objectId: string, key: string, value: any, attachments?: RoomAttachments) {
		if (attachments != null) {
			this.roomAttachments = attachments;
		}

		const o = this.roomState.installedObjects.find(o => o.id === objectId);
		if (o == null) return;

		const def = getObjectDef(o.type);
		o.options[key] = value;

		this.ev('changeRoomState', { roomState: this.roomState });

		const entity = this.objectEntities.get(objectId);
		if (entity == null) return;

		const converted = convertRawOptions(def.options.schema, o.options, this.roomAttachments);
		entity.convertedOptions[key] = converted[key];

		this.sr.disableSnapshotRendering();
		entity.instance.onOptionsUpdated?.([key, converted[key]]);
		this.sr.enableSnapshotRendering();
	}

	public updateEnvOptions(options: RoomState['env']['options']) {
		this.roomState.env.options = options;
		this.envManager.applyOptions(options);
		this.ev('changeRoomState', { roomState: this.roomState });
	}

	private playSfxUrl(url: string, options: { volume: number; playbackRate: number }) {
		this.ev('playSfxUrl', { url, options });
	}

	public resize() {
		// 一旦snapshot renderingを無効にしておかないとエラーが出る(babylonのバグ？)
		// ~~...が、一旦無効にしたらしたで複数のマテリアルがそれぞれ入れ替わる(?)という謎の現象が発生するためコメントアウトしとく(エラー出てもレンダリングが止まったりするわけでもないし)~~
		// ↑追記: engine.resizeした後に一瞬待つことで回避できることが判明
		this.sr.disableSnapshotRendering();
		this.engine.resize(true);
		// workerで実行される可能性がある
		// eslint-disable-next-line no-restricted-globals
		setTimeout(() => {
			this.sr.enableSnapshotRendering();
		}, 1);
	}

	public destroy() {
		this.engine.stopRenderLoop();
		if (this.currentRafId != null) {
			// workerで実行される可能性がある
			cancelAnimationFrame(this.currentRafId);
			this.currentRafId = null;
		}
		this.timer.dispose();
		this.envManager.dispose();
		this.engine.dispose();
		this.scene.dispose();
		this.disposed = true;
	}
}
