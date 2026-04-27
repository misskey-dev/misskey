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
import { GridMaterial } from '@babylonjs/materials';
import { EventEmitter } from 'eventemitter3';
import { TIME_MAP, scaleMorph, camelToKebab, cm, WORLD_SCALE, getMeshesBoundingBox, Timer, getYRotationDirection, FreeCameraTouchVirtualJoystickInput } from '../utility.js';
import { getObjectDef } from './object-defs.js';
import { findMaterial, ModelManager, SYSTEM_HEYA_MESH_NAMES, SYSTEM_MESH_NAMES } from './utility.js';
import { SimpleHeyaManager } from './heya.js';
import type { HeyaManager, JapaneseHeyaOptions, SimpleHeyaOptions } from './heya.js';
import type { ObjectDef, RoomObjectInstance, RoomStateObject } from './object.js';
import { genId } from '@/utility/id.js';
import { deepClone } from '@/utility/clone.js';

const BAKE_TRANSFORM = false; // 実験的
const SNAPSHOT_RENDERING = true; // 実験的
const IGNORE_OBJECTS: string[] = []; // for debug
const RENDER_OUTDOOR_ENV = false;
const IN_WEB_WORKER = typeof window === 'undefined';

export type RoomState = {
	heya: {
		type: 'simple';
		options: SimpleHeyaOptions;
	} | {
		type: 'japanese';
		options: JapaneseHeyaOptions;
	};
	roomLightColor: [number, number, number];
	installedObjects: RoomStateObject<any>[];
};

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

export const GRAPHICS_QUALITY_HIGH = 1;
export const GRAPHICS_QUALITY_MEDIUM = 0;
export const GRAPHICS_QUALITY_LOW = -1;

export type RoomEngineEvents = {
	'changeSelectedState': (ctx: {
		selected: {
			objectId: string;
			objectState: RoomStateObject<any>;
			objectDef: ObjectDef<any>;
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

export class RoomEngine extends EventEmitter<RoomEngineEvents> {
	private useGlow: boolean;
	private canvas: HTMLCanvasElement;
	private engine: BABYLON.WebGPUEngine;
	public scene: BABYLON.Scene;
	private shadowGeneratorForRoomLight: BABYLON.ShadowGenerator | null = null;
	private shadowGeneratorForSunLight: BABYLON.ShadowGenerator | null = null;
	public camera: BABYLON.UniversalCamera;
	public objectEntities: Map<string, {
		rootMesh: BABYLON.Mesh;
		instance: RoomObjectInstance;
		model: ModelManager;
	}> = new Map();
	private heyaManager: HeyaManager | null = null;

	// TODO: たぶんオブジェクト内の値のmutateはsetで検知できないので、そのような操作を実際に行うようになった & それを検知する必要性が出てきたら専用の設定関数などを新設してそれを使わせる
	private _grabbingCtx: {
		objectId: string;
		objectType: string;
		forInstall: boolean;
		mesh: BABYLON.TransformNode;
		originalDiffOfPosition: BABYLON.Vector3;
		originalDiffOfRotationY: number;
		distance: number;
		rotation: number;
		ghost: BABYLON.AbstractMesh;
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
		this.emit('changeGrabbingState', { grabbing: v == null ? null : { forInstall: v.forInstall } });
	}

	// TODO: たぶんオブジェクト内の値のmutateはsetで検知できないので、そのような操作を実際に行うようになった & それを検知する必要性が出てきたら専用の設定関数などを新設してそれを使わせる
	private _selected: {
		objectId: string;
		objectEntity: RoomEngine['objectEntities'] extends Map<string, infer V> ? V : never;
		objectState: RoomStateObject<any>;
		objectDef: ObjectDef;
	} | null = null;
	get selected() {
		return this._selected;
	}
	set selected(v) {
		this._selected = v;
		this.emit('changeSelectedState', { selected: v == null ? null : { objectId: v.objectId, objectState: v.objectState, objectDef: v.objectDef } });
	}

	private time: 0 | 1 | 2 = 0; // 0: 昼, 1: 夕, 2: 夜
	public roomState: RoomState;

	private _gridSnapping = { enabled: true, scale: cm(4) };
	get gridSnapping() {
		return this._gridSnapping;
	}
	set gridSnapping(v) {
		this._gridSnapping = v;
		this.gridMaterial.gridRatio = v.scale; // setter内でconstructor内設定の値に依存するのはタイミングによってはundefinedになりそうなので、実際に当該マテリアルを表示する必要が生じる直前に利用側で設定させた方がいいかもしれない
		this.emit('changeGridSnapping', { gridSnapping: v });
	}

	private putParticleSystem: BABYLON.ParticleSystem;
	private envMapIndoor: BABYLON.CubeTexture;
	private envMapOutdoor: BABYLON.CubeTexture;
	private roomLight: BABYLON.SpotLight;
	public lightContainer: BABYLON.ClusteredLightContainer;
	private gridMaterial: GridMaterial;
	private gridPlane: BABYLON.Mesh;
	private gizmoManager: BABYLON.GizmoManager;
	private selectionOutlineLayer: BABYLON.SelectionOutlineLayer | null = null;
	public sr: BABYLON.SnapshotRenderingHelper;
	private gl: BABYLON.GlowLayer | null = null;
	public timer: Timer = new Timer();

	private _isEditMode = false;
	get isEditMode() {
		return this._isEditMode;
	}
	set isEditMode(v) {
		this._isEditMode = v;
		this.emit('changeEditMode', { isEditMode: v });
	}

	public isSitting = false;
	private fps: number | null = null;
	private disposed = false;

	public domEvents: EventEmitter<{
		'click': (event: { offsetX: number; offsetY: number; }) => void;
		'keydown': (event: { code: string; shiftKey: boolean; }) => void;
		'keyup': (event: { code: string; shiftKey: boolean; }) => void;
		'wheel': (event: { deltaY: number; }) => void;
	}> = new EventEmitter();

	constructor(roomState: RoomState, options: {
		canvas: HTMLCanvasElement;
		engine: BABYLON.WebGPUEngine;
		graphicsQuality: number;
		fps: number | null;
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
		this.canvas = options.canvas;

		this.fps = options.fps;
		this.useGlow = options.graphicsQuality >= GRAPHICS_QUALITY_MEDIUM;

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

		this.envMapIndoor = BABYLON.CubeTexture.CreateFromPrefilteredData('/client-assets/room/indoor.env', this.scene);
		this.envMapIndoor.boundingBoxSize = new BABYLON.Vector3(cm(500), cm(500), cm(500));

		this.envMapOutdoor = BABYLON.CubeTexture.CreateFromPrefilteredData(this.time === 2 ? '/client-assets/room/outdoor-night.env' : '/client-assets/room/outdoor-day.env', this.scene);
		this.envMapOutdoor.level = this.time === 0 ? 0.5 : this.time === 1 ? 0.3 : 0.1;

		const roomCollisionCube = BABYLON.MeshBuilder.CreateBox('roomCollisionCube', { size: cm(300) }, this.scene);
		roomCollisionCube.position.y = cm(150);
		roomCollisionCube.scaling.x = -1; // flip normals
		roomCollisionCube.isVisible = false;
		roomCollisionCube.isPickable = false;
		roomCollisionCube.checkCollisions = true;

		this.scene.collisionsEnabled = true;

		this.camera = options.useVirtualJoystick ? new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, cm(130), cm(0)), this.scene) : new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, cm(130), cm(0)), this.scene);
		this.camera.minZ = cm(1);
		this.camera.maxZ = RENDER_OUTDOOR_ENV ? cm(10000) : cm(1000);
		this.camera.fov = 1;
		this.camera.ellipsoid = new BABYLON.Vector3(cm(15), cm(65), cm(15));
		this.camera.checkCollisions = true;
		this.camera.applyGravity = true;
		this.camera.needMoveForGravity = true;

		if (options.useVirtualJoystick) {
			this.camera.inputs.clear();
			this.camera.inputs.add(new FreeCameraTouchVirtualJoystickInput({
				moveSensitivity: 0.015 * WORLD_SCALE,
				rotationSensitivity: 0.1,
			}));
			this.camera.inertia = 0.75;
		} else {
			const normalSpeed = 0.02 * WORLD_SCALE;
			this.camera.speed = normalSpeed;

			this.camera.keysUp.push(87); // W
			this.camera.keysDown.push(83); // S
			this.camera.keysLeft.push(65); // A
			this.camera.keysRight.push(68); // D
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
		}

		this.camera.attachControl(this.canvas);

		//this.scene.activeCamera = this.camera;

		this.roomLight = new BABYLON.SpotLight('roomLight', new BABYLON.Vector3(0, cm(249), 0), new BABYLON.Vector3(0, -1, 0), 16, 8, this.scene);
		this.roomLight.diffuse = roomState.roomLightColor != null ? new BABYLON.Color3(...roomState.roomLightColor) : new BABYLON.Color3(1.0, 0.9, 0.8);
		this.roomLight.shadowMinZ = cm(10);
		this.roomLight.shadowMaxZ = cm(300);
		this.roomLight.radius = cm(30);

		if (options.graphicsQuality >= GRAPHICS_QUALITY_MEDIUM) {
			this.shadowGeneratorForRoomLight = new BABYLON.ShadowGenerator(options.graphicsQuality <= GRAPHICS_QUALITY_MEDIUM ? 1024 : 2048, this.roomLight);
			this.shadowGeneratorForRoomLight.forceBackFacesOnly = true;
			this.shadowGeneratorForRoomLight.bias = 0.00001;
			this.shadowGeneratorForRoomLight.normalBias = 0.005;
			this.shadowGeneratorForRoomLight.usePercentageCloserFiltering = true;
			this.shadowGeneratorForRoomLight.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
			if (options.graphicsQuality <= GRAPHICS_QUALITY_MEDIUM) {
				this.shadowGeneratorForRoomLight.getShadowMap().refreshRate = 60;
			}
			//this.shadowGeneratorForRoomLight.useContactHardeningShadow = true;
		}

		if (options.graphicsQuality >= GRAPHICS_QUALITY_MEDIUM) {
			const sunLight = new BABYLON.DirectionalLight('sunLight', new BABYLON.Vector3(0.2, -1, -1), this.scene);
			sunLight.position = new BABYLON.Vector3(cm(-20), cm(1000), cm(1000));
			sunLight.diffuse = this.time === 0 ? new BABYLON.Color3(1.0, 0.9, 0.8) : this.time === 1 ? new BABYLON.Color3(1.0, 0.8, 0.6) : new BABYLON.Color3(0.6, 0.8, 1.0);
			sunLight.intensity = this.time === 0 ? 3 : this.time === 1 ? 1 : 0.25;
			sunLight.shadowMinZ = cm(1000);
			sunLight.shadowMaxZ = cm(2000);

			this.shadowGeneratorForSunLight = new BABYLON.ShadowGenerator(options.graphicsQuality <= GRAPHICS_QUALITY_MEDIUM ? 1024 : 2048, sunLight);
			this.shadowGeneratorForSunLight.forceBackFacesOnly = true;
			this.shadowGeneratorForSunLight.bias = 0.00001;
			this.shadowGeneratorForSunLight.usePercentageCloserFiltering = true;
			this.shadowGeneratorForSunLight.usePoissonSampling = true;
			if (options.graphicsQuality <= GRAPHICS_QUALITY_MEDIUM) {
				this.shadowGeneratorForSunLight.getShadowMap().refreshRate = 60;
			}
		}

		this.lightContainer = new BABYLON.ClusteredLightContainer('clustered', [], this.scene);
		this.lightContainer.maxRange = options.graphicsQuality >= GRAPHICS_QUALITY_HIGH ? cm(1000) : options.graphicsQuality >= GRAPHICS_QUALITY_MEDIUM ? cm(100) : cm(50);
		this.lightContainer.verticalTiles = 32;
		this.lightContainer.horizontalTiles = 32;
		this.lightContainer.depthSlices = 32;

		this.turnOnRoomLight(true);

		if (this.useGlow) {
			this.gl = new BABYLON.GlowLayer('glow', this.scene, {
				//mainTextureFixedSize: 512,
				blurKernelSize: 64,
			});
			this.gl.intensity = 0.5;
			this.scene.setRenderingAutoClearDepthStencil(this.gl.renderingGroupId, false);

			if (SNAPSHOT_RENDERING) {
				this.sr.updateMeshesForEffectLayer(this.gl);
			}
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

		this.gizmoManager = new BABYLON.GizmoManager(this.scene);
		this.gizmoManager.positionGizmoEnabled = false;

		this.gridMaterial = new GridMaterial('grid', this.scene);
		this.gridMaterial.lineColor = new BABYLON.Color3(0.5, 0.5, 0.5);
		this.gridMaterial.mainColor = new BABYLON.Color3(0, 0, 0);
		this.gridMaterial.minorUnitVisibility = 1;
		this.gridMaterial.opacity = 0.5;
		this.gridMaterial.gridRatio = this.gridSnapping.scale;
		this.gridMaterial.backFaceCulling = false;

		this.gridPlane = BABYLON.MeshBuilder.CreatePlane('gridPlane', { width: cm(1000), height: cm(1000) }, this.scene);
		this.gridPlane.material = this.gridMaterial;
		this.gridPlane.isPickable = false;
		this.gridPlane.isVisible = false;

		if (options.graphicsQuality >= GRAPHICS_QUALITY_MEDIUM) {
			this.selectionOutlineLayer = new BABYLON.SelectionOutlineLayer('outliner', this.scene);
			this.scene.setRenderingAutoClearDepthStencil(this.selectionOutlineLayer.renderingGroupId, false);
			if (SNAPSHOT_RENDERING) {
				this.sr.updateMeshesForEffectLayer(this.selectionOutlineLayer);
			}
		}

		if (options.graphicsQuality >= GRAPHICS_QUALITY_HIGH) {
			const pipeline = new BABYLON.DefaultRenderingPipeline('default', true, this.scene);

			pipeline.bloomEnabled = true;
			pipeline.bloomThreshold = 0.95;
			pipeline.bloomWeight = 0.3;
			pipeline.bloomKernel = 256;
			pipeline.bloomScale = 2;
		}

		if (_DEV_) {
			// snapshot renderingかつglow layerが有効だとなんかクラッシュする
			if (!(SNAPSHOT_RENDERING && this.useGlow)) {
				import('@babylonjs/core/Debug/axesViewer').then(m => {
					const { AxesViewer } = m;
					const axes = new AxesViewer(this.scene, 30);
					axes.xAxis.position = new BABYLON.Vector3(0, 30, 0);
					axes.yAxis.position = new BABYLON.Vector3(0, 30, 0);
					axes.zAxis.position = new BABYLON.Vector3(0, 30, 0);
				});
			}
		}
	}

	public async init() {
		await this.loadHeya();
		if (RENDER_OUTDOOR_ENV) await this.loadEnvModel();

		const objects = this.roomState.installedObjects.filter(o => !IGNORE_OBJECTS.includes(o.type));
		let loadedCount = 0;

		await Promise.all(objects.map(o => this.loadObject({
			id: o.id,
			type: o.type,
			position: new BABYLON.Vector3(...o.position),
			rotation: new BABYLON.Vector3(o.rotation[0], o.rotation[1], o.rotation[2]),
			options: o.options,
		}).then(() => {
			loadedCount++;
			this.emit('loadingProgress', { progress: loadedCount / objects.length });
			console.log(`Loaded object ${o.id} (${o.type})`);
		})));

		// 不具合のもと
		//this.scene.blockMaterialDirtyMechanism = true;

		this.startRenderLoop();

		await this.scene.whenReadyAsync();

		if (SNAPSHOT_RENDERING) {
			// 必ずシーンが少なくとも1フレームレンダリングがされてから呼ばれるように注意すること。そうしないとタイミングによってはエンジンがクラッシュする
			this.sr.enableSnapshotRendering();
		}

		this.domEvents.on('keydown', (ev) => {
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
					this.changeGrabbingRotationY(Math.PI / 8);
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

		this.domEvents.on('wheel', (ev) => {
			if (this.grabbingCtx != null) {
				this.changeGrabbingDistance(ev.deltaY * 0.025);
			} else {
				this.camera.fov += ev.deltaY * 0.001;
				this.camera.fov = Math.max(0.25, Math.min(1, this.camera.fov));
			}
		});

		this.domEvents.on('click', (ev) => {
			if (this.grabbingCtx != null) return;

			this.selectObject(null);

			// TODO: __PICK__考慮
			const pickingInfo = this.scene.pick(this.scene.pointerX, this.scene.pointerY,
				(m) => m.name.includes('__PICK__') || (m.isVisible && m.isEnabled() && m.metadata?.objectId != null && this.objectEntities.has(m.metadata.objectId)));

			if (pickingInfo.pickedMesh != null) {
				const oid = pickingInfo.pickedMesh.metadata.objectId;
				if (oid != null && this.objectEntities.has(oid)) {
					const o = this.objectEntities.get(oid)!;
					const boundingInfo = getMeshesBoundingBox(o.rootMesh.getChildMeshes().filter(m => m.isEnabled() && m.isVisible && !m.isDisposed()));
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
							if (SNAPSHOT_RENDERING) { // 視点が動くとアウトラインが薄くなるのでリセット (babylonのバグ？)
								this.sr.disableSnapshotRendering();
								this.sr.enableSnapshotRendering();
							}
						});
					}
				}
			}
		});
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

	public pauseRender() {
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

	public cameraJoystickMove(vector: { x: number; y: number; }) {
		(this.camera.inputs.attached.joystick as FreeCameraTouchVirtualJoystickInput).setJoystickMoveVector(vector);
	}

	public cameraJoystickRotate(vector: { x: number; y: number; }) {
		(this.camera.inputs.attached.joystick as FreeCameraTouchVirtualJoystickInput).setJoystickRotationVector(vector);
	}

	public selectObject(objectId: string | null) {
		if (SNAPSHOT_RENDERING) this.sr.disableSnapshotRendering(); // snapshot rendering中にbake/unbakeするとエラーになる。なおこのメソッドは参照カウント方式な点に留意

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
				//this.gizmoManager.positionGizmoEnabled = true;
				//this.gizmoManager.gizmos.positionGizmo.updateGizmoRotationToMatchAttachedMesh = false;
				//this.gizmoManager.attachToMesh(entity.rootMesh);
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

		if (SNAPSHOT_RENDERING) this.sr.enableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
	}

	private handleGrabbing() {
		if (this.grabbingCtx == null) return;
		const grabbing = this.grabbingCtx;

		const placement = getObjectDef(grabbing.objectType).placement;

		const dir = this.camera.getDirection(BABYLON.Axis.Z).scale(this.scene.useRightHandedSystem ? -1 : 1);
		const newPos = this.camera.position.add(dir.scale(grabbing.distance)).add(grabbing.originalDiffOfPosition);
		const newRotation = new BABYLON.Vector3(0, this.camera.rotation.y + grabbing.originalDiffOfRotationY + grabbing.rotation, 0);
		grabbing.ghost.position = newPos.clone();
		grabbing.ghost.rotation = newRotation.clone();

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
					const pickedMeshNormal = hit.getNormal(true, true);
					const targetRotationY = Math.atan2(pickedMeshNormal.x, pickedMeshNormal.z);
					newRotation.y = targetRotationY;
					newPos.x = hit.pickedPoint.x;
					newPos.y = hit.pickedPoint.y;
					newPos.z = hit.pickedPoint.z;
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
						this.gridPlane.position = new BABYLON.Vector3(newPos.x, newPos.y, newPos.z).addInPlace(pickedMeshNormal.scale(cm(0.1)));
						this.gridPlane.isVisible = true;
					}
				}
			} else if (placement === 'bottom' || placement === 'ceiling') {
				// 上に向かってレイを飛ばす
				const ray = new BABYLON.Ray(pos, new BABYLON.Vector3(0, 1, 0), cm(1000));
				const hit = placement === 'bottom' ? this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_CEILING__') || m.name.includes('__ROOM_BOTTOM__') || m.name.includes('__BOTTOM__'))) : this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_CEILING__')));
				if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
					sticky = true;
					newPos.x = hit.pickedPoint.x;
					newPos.y = hit.pickedPoint.y;
					newPos.z = hit.pickedPoint.z;
					stickyOtherObject = hit.pickedMesh.metadata?.objectId ?? null;

					if (this.gridSnapping.enabled) {
						newPos.x = Math.round(newPos.x / this.gridSnapping.scale) * this.gridSnapping.scale;
						newPos.z = Math.round(newPos.z / this.gridSnapping.scale) * this.gridSnapping.scale;

						this.gridPlane.rotationQuaternion = null;
						this.gridPlane.rotation.x = Math.PI * 1.5;
						this.gridPlane.rotation.y = 0;
						this.gridPlane.position = new BABYLON.Vector3(grabbing.mesh.position.x, grabbing.mesh.position.y - cm(0.1), grabbing.mesh.position.z);
						this.gridPlane.isVisible = true;
					}
				}
			} else { // top or floor
				// 下に向かってレイを飛ばす
				const ray = new BABYLON.Ray(pos, new BABYLON.Vector3(0, -1, 0), cm(1000));
				const hit = placement === 'top' ? this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_FLOOR__') || m.name.includes('__ROOM_TOP__') || m.name.includes('__TOP__'))) : this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_FLOOR__')));
				if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
					sticky = true;
					newPos.x = hit.pickedPoint.x;
					newPos.y = hit.pickedPoint.y;
					newPos.z = hit.pickedPoint.z;
					stickyOtherObject = hit.pickedMesh.metadata?.objectId ?? null;

					if (this.gridSnapping.enabled) {
						newPos.x = Math.round(newPos.x / this.gridSnapping.scale) * this.gridSnapping.scale;
						newPos.z = Math.round(newPos.z / this.gridSnapping.scale) * this.gridSnapping.scale;

						this.gridPlane.rotationQuaternion = null;
						this.gridPlane.rotation.x = Math.PI / 2;
						this.gridPlane.rotation.y = 0;
						this.gridPlane.position = new BABYLON.Vector3(grabbing.mesh.position.x, grabbing.mesh.position.y + cm(0.1), grabbing.mesh.position.z);
						this.gridPlane.isVisible = true;
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
		}

		if (!sticky) {
			this.gridPlane.isVisible = false;
			//for (const mesh of grabbing.ghost.getChildMeshes()) {
			//if (mesh.material instanceof BABYLON.MultiMaterial) {
			//	for (const subMat of mesh.material.subMaterials) {
			//		if (subMat instanceof BABYLON.PBRMaterial) {
			//			subMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
			//		}
			//	}
			//} else {
			//	mesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
			//}
			//}
		}

		//const pos = new BABYLON.Vector3(this.camera.position.x, this.camera.position.y, this.camera.position.z);
		//const _dir = newPos.subtract(pos).normalize();
		//for (let i = 0; i < grabbing.distance; i++) {
		//	// posを1cmずつnewPosの方向に動かす
		//	pos.addInPlace(_dir.scale(cm(1)));
		//	// 前方に向かってレイを飛ばして衝突チェック
		//	const ray = new BABYLON.Ray(this.camera.position, dir, i);
		//	const hit = this.scene.pickWithRay(ray, (m) => isCollisionTarget(m));
		//	if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
		//		//const isCollided = grabbing.mesh.intersectsMesh(hit.pickedMesh, false);
		//		//if (isCollided) {
		//		break;
		//		//}
		//	}
		//	grabbing.mesh.position = pos.clone();
		//}

		//const ray = new BABYLON.Ray(this.camera.position, this.camera.getDirection(BABYLON.Axis.Z), cm(1000));
		//const hit = this.scene.pickWithRay(ray, (m) => m.name.includes('__COLLISION_WALL__'))!;
		//if (hit.pickedMesh != null) {
		//	const grabbingBox = this.grabbing.mesh.getBoundingInfo().boundingBox;
		//	const grabDistanceVector = this.grabbing.mesh.position.subtract(this.camera.position);
		//	if (grabDistanceVector.length() > hit.distance) {
		//		this.grabbing.mesh.position = this.camera.position.add(dir.scale(hit.distance));
		//		this.grabbing.mesh.position.y = y;
		//	}
		//}

		//const displacementVector = new BABYLON.Vector3(
		//	this.grabbing.ghost.position.x - this.grabbing.mesh.position.x,
		//	0,
		//	this.grabbing.ghost.position.z - this.grabbing.mesh.position.z,
		//);
		//this.grabbing.mesh.moveWithCollisions(displacementVector);
		//this.grabbing.mesh.position.y = y;

		//for (const soid of stickyObjectIds) {
		//	//const soMesh = this.objectMeshs.get(soid)!;
		//	//const offset = this.grabbing.mesh!.position.subtract(soMeshStartPosition);
		//	//soMesh.position = this.grabbing.mesh!.position.subtract(offset);
		//}

		grabbing.onMove?.({
			position: newPos,
			rotation: newRotation,
			sticky: stickyOtherObject,
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

	public async changeHeyaType(type: RoomState['heya']['type']) {
		this.roomState.heya.type = type;

		if (this.heyaManager != null) {
			this.heyaManager.dispose();
		}

		const onMeshUpdatedCallback = (meshes: BABYLON.AbstractMesh[]) => {
			for (const m of meshes) {
				if (SYSTEM_HEYA_MESH_NAMES.some(name => m.name.includes(name))) {
					m.isPickable = false;
					m.receiveShadows = false;
					m.isVisible = false;
					m.checkCollisions = false;
					continue;
				}

				m.isPickable = false;
				m.checkCollisions = false;
				m.receiveShadows = true;
				this.shadowGeneratorForRoomLight?.addShadowCaster(m);
				this.shadowGeneratorForSunLight?.addShadowCaster(m);
				//if (m.material) (m.material as BABYLON.PBRMaterial).ambientColor = new BABYLON.Color3(1, 1, 1);
				if (m.material) {
					(m.material as BABYLON.PBRMaterial).reflectionTexture = this.envMapIndoor;
					(m.material as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
				}
			}
		};

		if (this.roomState.heya.type === 'simple') {
			const heyaManager = new SimpleHeyaManager(onMeshUpdatedCallback);
			await heyaManager.load(this.roomState.heya.options, this.scene);
			this.heyaManager = heyaManager;
		} else if (this.roomState.heya.type === 'japanese') {
			// TODO
		}

		this.emit('changeRoomState', { roomState: this.roomState });
	}

	private async loadHeya() {
		await this.changeHeyaType(this.roomState.heya.type);
	}

	private async loadObject(args: {
		type: string;
		id: string;
		position: BABYLON.Vector3;
		rotation: BABYLON.Vector3;
		options: any;
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
						this.shadowGeneratorForRoomLight?.addShadowCaster(mesh);
						this.shadowGeneratorForSunLight?.addShadowCaster(mesh);
					}

					//if (mesh.material) (mesh.material as BABYLON.PBRMaterial).ambientColor = new BABYLON.Color3(0.2, 0.2, 0.2);
					if (mesh.material) {
						if (mesh.material instanceof BABYLON.MultiMaterial) {
							for (const subMat of mesh.material.subMaterials) {
								if ((subMat as BABYLON.PBRMaterial).subSurface.isRefractionEnabled) {
									(subMat as BABYLON.PBRMaterial).subSurface.isRefractionEnabled = false; // 有効にするとドローコールが激増する(babylonのバグか仕様かは不明)
									(subMat as BABYLON.PBRMaterial).transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
								}
								(subMat as BABYLON.PBRMaterial).reflectionTexture = this.envMapIndoor;
								(subMat as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
								(subMat as BABYLON.PBRMaterial).anisotropy.isEnabled = false; // なんかきれいにレンダリングされないため
							}
						} else {
							if ((mesh.material as BABYLON.PBRMaterial).subSurface.isRefractionEnabled) {
								(mesh.material as BABYLON.PBRMaterial).subSurface.isRefractionEnabled = false; // 有効にするとドローコールが激増する(babylonのバグか仕様かは不明)
								(mesh.material as BABYLON.PBRMaterial).transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
							}
							(mesh.material as BABYLON.PBRMaterial).reflectionTexture = this.envMapIndoor;
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
		});

		const objectInstance = await def.createInstance({
			room: this,
			scene: this.scene,
			root,
			options: args.options,
			model,
			id: args.id,
			timer: this.timer, // TODO: 家具が撤去された後も動作し続けるのをどうにかする
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

		this.objectEntities.set(args.id, { instance: objectInstance, rootMesh: root, model });

		return { root, objectInstance };
	}

	private highlightMeshes(meshes: BABYLON.AbstractMesh[]) {
		if (this.selectionOutlineLayer == null) return;

		//if (this.engine.snapshotRendering) return; // snapshot rendering内でそのままやろうとするとエラーになる 回避実装もめんどいので単に無視
		if (SNAPSHOT_RENDERING) this.sr.disableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
		this.clearHighlight();
		this.selectionOutlineLayer.addSelection(meshes);
		if (SNAPSHOT_RENDERING) this.sr.enableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
	}

	private clearHighlight() {
		if (this.selectionOutlineLayer == null) return;

		//if (this.engine.snapshotRendering) return; // snapshot rendering内でそのままやろうとするとエラーになる 回避実装もめんどいので単に無視
		if (SNAPSHOT_RENDERING) this.sr.disableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
		this.selectionOutlineLayer.clearSelection();
		if (SNAPSHOT_RENDERING) this.sr.enableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
	}

	public beginSelectedInstalledObjectGrabbing() {
		if (this.selected == null) return;

		const selectedObject = this.selected.objectEntity.rootMesh;
		this.clearHighlight();

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

		const initialPosition = selectedObject.position.clone();
		const initialRotation = selectedObject.rotation.clone();

		let sticky: string | null;

		this.grabbingCtx = {
			objectId: selectedObject.metadata.objectId,
			objectType: selectedObject.metadata.objectType,
			forInstall: false,
			mesh: selectedObject,
			originalDiffOfPosition: selectedObject.position.subtract(this.camera.position.add(dir.scale(distance))),
			originalDiffOfRotationY: selectedObject.rotation.subtract(this.camera.rotation).y,
			distance: distance,
			rotation: 0,
			ghost: ghost,
			descendantStickyObjectIds,
			onMove: (info) => {
				sticky = info.sticky;
			},
			onCancel: () => {
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
			},
			onDone: () => { // todo: sticky状態などを引数でもらうようにしたい
				this.putParticleSystem.emitter = selectedObject.position.clone();
				this.putParticleSystem.start();

				this.playSfxUrl('/client-assets/room/sfx/put.mp3', {
					volume: 1,
					playbackRate: 1,
				});

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

				// TODO: アニメーションの完了まで親子関係の解除を遅延するため、一瞬「grabbingが終わっているのに親子関係が解除されていない」状態が発生する。その間に新たにgrabbingを開始するなどの別の操作が発生すると不具合のもとになるのでそれを防止する仕組みを作る
				animating.promise.then(() => {
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

					const pos = selectedObject.position.clone();
					const rotation = selectedObject.rotation.clone();
					this.roomState.installedObjects.find(o => o.id === selectedObject.metadata.objectId)!.sticky = sticky;
					this.roomState.installedObjects.find(o => o.id === selectedObject.metadata.objectId)!.position = [pos.x, pos.y, pos.z];
					this.roomState.installedObjects.find(o => o.id === selectedObject.metadata.objectId)!.rotation = [rotation.x, rotation.y, rotation.z];

					this.emit('changeRoomState', { roomState: this.roomState });
				});
			},
		};

		this.timer.setInterval(() => {
			this.handleGrabbing();
		}, 10);

		this.playSfxUrl('/client-assets/room/sfx/grab.mp3', {
			volume: 1,
			playbackRate: 1,
		});
	}

	public endGrabbing(cancel = false) {
		if (this.grabbingCtx == null) return;

		// 一度に子までdisposeしようとするとなぜか照明系の家具の場合エンジンがクラッシュする(消しちゃまずいものが子に混じっている？)ので、まず子からちびちび消していく
		//this.grabbingCtx.ghost.dispose(false, false);
		for (const m of this.grabbingCtx.ghost.getChildMeshes()) {
			m.dispose(true, false);
		}
		this.grabbingCtx.ghost.dispose(true, false);

		if (cancel) {
			this.grabbingCtx.onCancel?.();
		} else {
			this.grabbingCtx.onDone?.();
		}
		this.grabbingCtx = null;

		this.gridPlane.isVisible = false;
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

	public updateRoomLightColor(color: [number, number, number]) {
		this.roomLight.diffuse = new BABYLON.Color3(...color);
		this.roomState.roomLightColor = color;
		this.emit('changeRoomState', { roomState: this.roomState });
	}

	private turnOnRoomLight(forInit = false) {
		if (!forInit && SNAPSHOT_RENDERING) this.sr.disableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
		this.roomLight.intensity = 18 * WORLD_SCALE * WORLD_SCALE;
		this.envMapIndoor.level = 0.6;
		if (!forInit && SNAPSHOT_RENDERING) {
			// workerで実行される可能性がある
			// eslint-disable-next-line no-restricted-globals
			setTimeout(() => {
				this.sr.enableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
			}, 10);
		}
	}

	private turnOffRoomLight() {
		if (SNAPSHOT_RENDERING) this.sr.disableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
		this.roomLight.intensity = 0;
		this.envMapIndoor.level = 0.025;
		// workerで実行される可能性がある
		// eslint-disable-next-line no-restricted-globals
		setTimeout(() => {
			if (SNAPSHOT_RENDERING) this.sr.enableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
		}, 10);
	}

	public toggleRoomLight() {
		if (this.roomLight.intensity > 0) {
			this.turnOffRoomLight();
		} else {
			this.turnOnRoomLight();
		}
	}

	private createGhost(mesh: BABYLON.Mesh): BABYLON.Mesh {
		// 対象のメッシュの子に、「子にlightを持つメッシュ」が含まれているとエンジンがクラッシュするので、とりあえず適当なメッシュを使う
		/*
		const ghost = mesh.clone('ghost', null, false)!;
		ghost.metadata = { isGhost: true };
		ghost.checkCollisions = false;
		for (const m of ghost.getChildMeshes()) {
			m.metadata = { isGhost: true };
			m.checkCollisions = false;
		}

		const materials = new WeakMap<BABYLON.Material, BABYLON.Material>();

		for (const m of ghost.getChildMeshes() as BABYLON.Mesh[]) {
			if (m.material == null) continue;

			if (materials.has(m.material)) {
				m.material = materials.get(m.material)!;
				continue;
			}

			if (m.subMeshes != null && m.subMeshes.length > 0 && m.material.subMaterials != null) {
				const multiGhostMaterial = m.material.clone(`${m.material.name}_ghost`) as BABYLON.MultiMaterial;

				for (let i = 0; i < multiGhostMaterial.subMaterials.length; i++) {
					const subMaterial = multiGhostMaterial.subMaterials[i];
					const ghostMaterial = subMaterial.clone(`${subMaterial.name}_ghost`);
					ghostMaterial.alpha = 0.3;
					ghostMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
					multiGhostMaterial.subMaterials[i] = ghostMaterial;
					materials.set(m.material, multiGhostMaterial);
					m.material = multiGhostMaterial;
				}
			} else {
				const ghostMaterial = m.material.clone(`${m.material.name}_ghost`);
				ghostMaterial.alpha = 0.3;
				ghostMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
				materials.set(m.material, ghostMaterial);
				m.material = ghostMaterial;
			}
		}

		return ghost;
		*/

		const ghost = new BABYLON.Mesh('ghost', this.scene);
		ghost.metadata = { isGhost: true };
		ghost.checkCollisions = false;

		return ghost;
	}

	public async addObject(type: string, _options?: any) {
		if (!this.isEditMode) return;
		if (this.grabbingCtx != null) return;
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

		this.grabbingCtx = {
			objectId: id,
			objectType: type,
			forInstall: true,
			mesh: root,
			originalDiffOfPosition: new BABYLON.Vector3(0, 0, 0),
			originalDiffOfRotationY: Math.PI,
			distance: distance,
			rotation: 0,
			ghost: ghost,
			descendantStickyObjectIds: [],
			onMove: (info) => {
				sticky = info.sticky;
			},
			onCancel: () => {
				// todo
			},
			onDone: () => { // todo: sticky状態などを引数でもらうようにしたい
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

				this.roomState.installedObjects.push({
					id,
					type,
					position: [pos.x, pos.y, pos.z],
					rotation: [rotation.x, rotation.y, rotation.z],
					sticky,
					options,
				});

				this.emit('changeRoomState', { roomState: this.roomState });
			},
		};

		this.timer.setInterval(() => {
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

		if (SNAPSHOT_RENDERING) {
			this.sr.disableSnapshotRendering();
		}
		if (this.gl != null) {
			this.gl.isEnabled = false; // 重いので切る
		}
	}

	public async exitEditMode() {
		this.selectObject(null);
		this.isEditMode = false;

		await this.bake();

		if (SNAPSHOT_RENDERING) {
			this.sr.enableSnapshotRendering();
		}
		if (this.gl != null) {
			this.gl.isEnabled = true;
		}
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
		this.emit('changeRoomState', { roomState: this.roomState });
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

	public changeGrabbingRotationY(delta: number) {
		if (this.grabbingCtx == null) return;
		this.grabbingCtx.rotation += delta;
	}

	public updateObjectOption(objectId: string, key: string, value: any) {
		const options = this.roomState.installedObjects.find(o => o.id === objectId)?.options;
		if (options == null) return;
		options[key] = value;

		this.emit('changeRoomState', { roomState: this.roomState });

		const entity = this.objectEntities.get(objectId);
		if (entity == null) return;
		entity.instance.onOptionsUpdated?.([key, value]);
	}

	public updateHeyaOptions(options: RoomState['heya']['options']) {
		this.roomState.heya.options = options;
		this.heyaManager.applyOptions(options);
		this.emit('changeRoomState', { roomState: this.roomState });
	}

	private playSfxUrl(url: string, options: { volume: number; playbackRate: number }) {
		this.emit('playSfxUrl', { url, options });
	}

	public resize() {
		// 一旦snapshot renderingを無効にしておかないとエラーが出る(babylonのバグ？)
		// ~~...が、一旦無効にしたらしたで複数のマテリアルがそれぞれ入れ替わる(?)という謎の現象が発生するためコメントアウトしとく(エラー出てもレンダリングが止まったりするわけでもないし)~~
		// ↑追記: engine.resizeした後に一瞬待つことで回避できることが判明
		if (SNAPSHOT_RENDERING) this.sr.disableSnapshotRendering();
		this.engine.resize();
		// workerで実行される可能性がある
		// eslint-disable-next-line no-restricted-globals
		setTimeout(() => {
			if (SNAPSHOT_RENDERING) this.sr.enableSnapshotRendering();
		}, 1);
	}

	public destroy() {
		if (this.currentRafId != null) {
			// workerで実行される可能性がある
			cancelAnimationFrame(this.currentRafId);
			this.currentRafId = null;
		}
		this.timer.dispose();
		this.engine.dispose();
		this.scene.dispose();
		this.disposed = true;
	}
}
