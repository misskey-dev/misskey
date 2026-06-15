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
// TODO: 一升瓶を選択するとエラーが出る現象をbabylonに報告
// TODO: dj-playerを選択するとエラーが出る現象をbabylonに報告
// TODO: pure barrel importが機能しない問題をbabylonに報告
// TODO: pure barrel importだとアニメーションが機能しない問題をbabylonに報告
// TODO: meshをdiposeした際、scene.meshesやshadowmapのrenderlistからも明示的に削除しないとメモリリークするのかどうかbabylonのforumで尋ねる
// TODO: 起動時、ひとつでもcustom imageの読み込みに失敗したら「一部の画像を読み込めませんでした」を出す
// TODO: 座ると一升瓶のマテリアルがおかしくなる現象をbabylonに報告

import * as BABYLON from '@babylonjs/core/pure.js';
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic.js';
import { cm, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { TIME_MAP, getMeshesBoundingBox, Timer, getYRotationDirection, FreeCameraManualInput, remap, GRAPHICS_QUALITY } from '../utility.js';
import { EngineBase } from '../EngineBase.js';
import { genId } from '../id.js';
import { deepClone } from '../clone.js';
import { PlayerContainer, type PlayerProfile, type PlayerState } from '../PlayerContainer.js';
import { getFurnitureDef } from './furniture-defs.js';
import { SYSTEM_MESH_NAMES } from './utility.js';
import { SimpleEnvManager } from './envs/simple.js';
import { JapaneseEnvManager } from './envs/japanese.js';
import { MuseumEnvManager } from './envs/museum.js';
import { CustomMadoriEnvManager } from './envs/customMadori.js';
import { FurnitureContainer } from './FurnitureContainer.js';
import type { FurnitureDef } from './furniture.js';
import type { GridMaterial } from '@babylonjs/materials';
import type { EnvManager } from './env.js';
import type { RoomState_InstalledFurniture } from 'misskey-world/src/room/furniture.js';
import type { RoomAttachments, RoomState } from 'misskey-world/src/room/type.js';
import type { RawOptions } from 'misskey-world/src/mono.js';

const BAKE_TRANSFORM = false; // 実験的
const IGNORE_FUNITURES: string[] = ['aquarium']; // for debug
const IN_WEB_WORKER = typeof window === 'undefined';

function enableFunitureCollision(meshes: BABYLON.Mesh[]) {
	for (const mesh of meshes) {
		if (mesh.name.includes('__COLLISION__')) {
			mesh.checkCollisions = true;
			//mesh.isVisible = true; // debug
		} else {
			mesh.checkCollisions = false;
		}
	}
}

// TODO: 回転を考慮
function intersectBoundingBoxes(bb1: { min: BABYLON.Vector3; max: BABYLON.Vector3; }, bb2: { min: BABYLON.Vector3; max: BABYLON.Vector3; }) {
	if (bb1.max.x < bb2.min.x || bb1.min.x > bb2.max.x) return false;
	if (bb1.max.y < bb2.min.y || bb1.min.y > bb2.max.y) return false;
	if (bb1.max.z < bb2.min.z || bb1.min.z > bb2.max.z) return false;
	return true;
}

export class RoomEngine extends EngineBase<{
	'changeSelectedState': (ctx: {
		selected: {
			furnitureId: string;
			funitureState: RoomState_InstalledFurniture;
			interacions: {
				id: string;
				label: string;
				isPrimary: boolean;
			}[];
		} | null;
	}) => void;
	'changeGrabbingState': (ctx: { grabbing: { forInstall: boolean } | null }) => void;
	'changeEditMode': (ctx: { isEditMode: boolean }) => void;
	'changeSittingState': (ctx: { isSitting: boolean }) => void;
	'changeGridSnapping': (ctx: { gridSnapping: { enabled: boolean; scale: number } }) => void;
	'changeRoomState': (ctx: { roomState: RoomState }) => void;
	'changeMyPlayerState': (ctx: PlayerState) => void;
	'playerPointed': (ctx: { playerId: string; }) => void;
	'playSfxUrl': (ctx: {
		url: string;
		options: {
			volume: number;
			playbackRate: number;
		};
	}) => void;
	'loadingProgress': (ctx: { progress: number }) => void;
	'contextlost': (ctx: { reason: string; message: string; }) => void;
}> {
	private useGlow: boolean;
	public camera: BABYLON.UniversalCamera;
	private cameraHeight = cm(130);
	private fov: number;
	private fixedCamera: BABYLON.FreeCamera;
	public furnitureContainers: Map<string, FurnitureContainer> = new Map();
	private envManager: EnvManager | null = null;

	// TODO: たぶんオブジェクト内の値のmutateはsetで検知できないので、そのような操作を実際に行うようになった & それを検知する必要性が出てきたら専用の設定関数などを新設してそれを使わせる
	private _grabbingCtx: {
		furnitureId: string;
		funitureType: string;
		forInstall: boolean;
		mesh: BABYLON.TransformNode;
		originalDiffOfPosition: BABYLON.Vector3;
		originalDiffOfRotation: BABYLON.Vector3;
		distance: number;
		rotation: number;
		ghost: BABYLON.TransformNode;
		descendantStickyFunitureIds: string[];
		onMove?: (info: { position: BABYLON.Vector3; rotation: BABYLON.Vector3; stickyFurnitureId: string | null; stickyPlaneId: string | null; }) => void;
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
		furnitureId: string;
		furnitureContainer: RoomEngine['furnitureContainers'] extends Map<string, infer V> ? V : never;
		funitureState: RoomState_InstalledFurniture;
		funitureDef: FurnitureDef;
	} | null = null;
	get selected() {
		return this._selected;
	}
	set selected(v) {
		this._selected = v;
		if (v == null) {
			this.ev('changeSelectedState', { selected: null });
			return;
		}
		this.ev('changeSelectedState', { selected: {
			furnitureId: v.furnitureId,
			funitureState: v.funitureState,
			interacions: Object.entries(v.furnitureContainer.instance.interactions).map(([interactionId, interactionInfo]) => ({
				id: interactionId,
				label: interactionInfo.label,
				isPrimary: v.furnitureContainer.instance.primaryInteraction === interactionId,
			})),
		} });
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

	private putParticleSystem: BABYLON.ParticleSystem | null = null;
	public lightContainer: BABYLON.ClusteredLightContainer;
	private gridMaterial: GridMaterial | null = null;
	private gridPlane: BABYLON.Mesh;
	private putAnimV: BABYLON.Animation;
	private putAnimH: BABYLON.Animation;
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

	private _isSitting = false;
	get isSitting() {
		return this._isSitting;
	}
	set isSitting(v) {
		this._isSitting = v;
		this.ev('changeSittingState', { isSitting: v });
	}

	private playerProfiles: Record<string, PlayerProfile> = {};
	private playerContainers: PlayerContainer[] = [];
	private showUsernameOnAvatar: boolean;
	private show2dAvatarOnAvatar: boolean;

	private inited = false;

	constructor(roomState: RoomState, roomAttachments: RoomAttachments, options: {
		engine: BABYLON.WebGPUEngine;
		graphicsQuality: number;
		fps: number | null;
		antialias: boolean;
		fov: number;
		useVirtualJoystick?: boolean;
		showUsernameOnAvatar: boolean;
		show2dAvatarOnAvatar: boolean;
	}) {
		super({
			engine: options.engine,
			fps: options.fps,
		});

		this.roomState = {
			...deepClone(roomState),
			installedFurnitures: roomState.installedFurnitures.map(o => ({
				...o,
				options: { ...deepClone(getFurnitureDef(o.type).options.default), ...o.options },
			})),
		};
		this.roomAttachments = roomAttachments;
		this.graphicsQuality = options.graphicsQuality;
		this.useGlow = this.graphicsQuality >= GRAPHICS_QUALITY.MEDIUM;
		this.fov = options.fov;
		this.showUsernameOnAvatar = options.showUsernameOnAvatar;
		this.show2dAvatarOnAvatar = options.show2dAvatarOnAvatar;
		this.time = TIME_MAP[new Date().getHours() as keyof typeof TIME_MAP];

		registerBuiltInLoaders();

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

		this.camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, this.cameraHeight, cm(0)), this.scene);
		this.camera.minZ = cm(1);
		this.camera.maxZ = cm(1000);
		this.camera.fov = this.fov;
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
		this.fixedCamera.inputs.add(new FreeCameraManualInput(this.scene, {
			moveSensitivity: 0.002 * WORLD_SCALE,
			rotationSensitivity: 0.0003,
		}));

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

		this.gridPlane = BABYLON.MeshBuilder.CreatePlane('gridPlane', { width: cm(10000), height: cm(10000) }, this.scene);
		this.gridPlane.isPickable = false;
		this.gridPlane.isVisible = false;
		this.gridPlane.setEnabled(false);

		{
			const easing = new BABYLON.ElasticEase(2);
			easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);

			this.putAnimV = new BABYLON.Animation(
				'',
				'scaling',
				60,
				BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
				BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
			);
			this.putAnimV.setKeys([
				{ frame: 0, value: new BABYLON.Vector3(0.9, 1.2, 0.9) },
				{ frame: 60, value: new BABYLON.Vector3(1, 1, 1) },
			]);
			this.putAnimV.setEasingFunction(easing);

			this.putAnimH = new BABYLON.Animation(
				'',
				'scaling',
				60,
				BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
				BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
			);
			this.putAnimH.setKeys([
				{ frame: 0, value: new BABYLON.Vector3(0.9, 0.9, 1.2) },
				{ frame: 60, value: new BABYLON.Vector3(1, 1, 1) },
			]);
			this.putAnimH.setEasingFunction(easing);
		}

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

	public async init() {
		await this.loadEnv();

		const funitures = this.roomState.installedFurnitures.filter(o => !IGNORE_FUNITURES.includes(o.type));
		let loadedCount = 0;

		if (this.roomState.worldScale !== WORLD_SCALE) {
			for (const o of funitures) {
				o.position = [
					remap(o.position[0], 0, this.roomState.worldScale, 0, WORLD_SCALE),
					remap(o.position[1], 0, this.roomState.worldScale, 0, WORLD_SCALE),
					remap(o.position[2], 0, this.roomState.worldScale, 0, WORLD_SCALE),
				];
			}
			this.roomState.worldScale = WORLD_SCALE;
			this.ev('changeRoomState', { roomState: this.roomState });
		}

		await Promise.all(funitures.map(o => this.loadFuniture({
			id: o.id,
			type: o.type,
			position: new BABYLON.Vector3(...o.position),
			rotation: new BABYLON.Vector3(o.rotation[0], o.rotation[1], o.rotation[2]),
			options: o.options,
		}).then(() => {
			loadedCount++;
			this.ev('loadingProgress', { progress: loadedCount / funitures.length });
		})));

		// 不具合のもと
		//this.scene.blockMaterialDirtyMechanism = true;

		if (_DEV_) { // SR状態確認用
			const box = BABYLON.MeshBuilder.CreateBox('', { size: cm(10) }, this.scene);

			setInterval(() => {
				box.position = new BABYLON.Vector3(0, Math.random() * cm(10), 0);
			}, 10);
		}

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
						this.beginSelectedInstalledFunitureGrabbing();
					}
				} else if (this.selected != null) {
					this.interact(this.selected.furnitureId);
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
				if (this.scene.activeCamera === this.camera) {
					this.camera.fov += ev.deltaY * 0.001;
					this.camera.fov = Math.max(0.25, Math.min(this.fov, this.camera.fov));
				} else if (this.scene.activeCamera === this.fixedCamera) {
					this.fixedCamera.fov += ev.deltaY * 0.001;
					this.fixedCamera.fov = Math.max(0.25, Math.min(this.fov, this.fixedCamera.fov));
				}
			}
		});

		this.inputs.on('zoom', (ev) => {
			if (this.grabbingCtx != null) {
				this.changeGrabbingDistance(ev.delta * 0.1);
			} else {
				if (this.scene.activeCamera === this.camera) {
					this.camera.fov += -ev.delta * 0.003;
					this.camera.fov = Math.max(0.25, Math.min(this.fov, this.camera.fov));
				} else if (this.scene.activeCamera === this.fixedCamera) {
					this.fixedCamera.fov += -ev.delta * 0.003;
					this.fixedCamera.fov = Math.max(0.25, Math.min(this.fov, this.fixedCamera.fov));
				}
			}
		});

		this.inputs.on('click', (ev) => {
			if (this.grabbingCtx != null) return;

			this.selectFuniture(null);

			// TODO: GPUPickerを使いたいが、なぜか一部のメッシュが反応しない
			const pickingInfo = this.scene.pick(ev.x, ev.y,
				(m) => m.name.includes('__PICK__') || m.metadata?.isPlayer || (m.isVisible && m.isEnabled() && m.metadata?.furnitureId != null && this.furnitureContainers.has(m.metadata.furnitureId)));

			if (pickingInfo.pickedMesh != null) {
				const oid = pickingInfo.pickedMesh.metadata.furnitureId;
				if (oid != null && this.furnitureContainers.has(oid)) {
					const o = this.furnitureContainers.get(oid)!;
					const boundingInfo = getMeshesBoundingBox(o.root.getChildMeshes().filter(m => m.isEnabled() && m.isVisible && !m.isDisposed()), true);
					this.selectFuniture(oid);
					this.look(boundingInfo.center);
					return;
				}

				const playerId = pickingInfo.pickedMesh.metadata.playerId;
				if (playerId != null && this.playerContainers.some(c => c.id === playerId)) {
					const c = this.playerContainers.find(c => c.id === playerId)!;
					this.look(c.root.position);
					this.ev('playerPointed', { playerId });
					return;
				}
			}
		});

		this.inputs.on('pointer', (ev) => {
			if (this.scene.activeCamera === this.camera) {
				(this.camera.inputs.attached.manual as FreeCameraManualInput).setRotationVector({ x: ev.x, y: ev.y });
			} else if (this.scene.activeCamera === this.fixedCamera) {
				(this.fixedCamera.inputs.attached.manual as FreeCameraManualInput).setRotationVector({ x: ev.x, y: ev.y });
			}
		});

		this.timer.setInterval(() => {
			const camera = this.scene.activeCamera!;
			const myPos = camera.globalPosition;
			const myRotation = camera.absoluteRotation.toEulerAngles();
			this.ev('changeMyPlayerState', {
				position: [myPos.x, myPos.y, myPos.z],
				rotation: [myRotation.x, myRotation.y, myRotation.z],
			});
		}, 100);

		this.inited = true;
	}

	private look(pos: BABYLON.Vector3) {
		const animTarget = new BABYLON.Animation(
			'',
			'target',
			60,
			BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
			BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
		);
		const keys = [
			{ frame: 0, value: this.camera.target.clone() },
			{ frame: 30, value: pos.clone() },
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

	// TODO: 初回以外で呼び出すとエンジンがクラッシュするのを修正
	public async changeEnvType(type: RoomState['env']['type'], options, forInit = false) {
		this.roomState.env.type = type;
		this.roomState.env.options = options;

		if (!forInit) {
			this.sr.disableSnapshotRendering();
			this.pauseRender();
		}

		let envManager: EnvManager;

		if (this.roomState.env.type === 'simple') {
			envManager = new SimpleEnvManager(this);
		} else if (this.roomState.env.type === 'japanese') {
			envManager = new JapaneseEnvManager(this);
		} else if (this.roomState.env.type === 'museum') {
			envManager = new MuseumEnvManager(this);
		} else if (this.roomState.env.type === 'customMadori') {
			envManager = new CustomMadoriEnvManager(this);
		} else {
			throw new Error(`Unrecognized env type: ${this.roomState.env.type}`);
		}

		await envManager.load(this.roomState.env.options);
		envManager.setTime(this.time);

		for (const mat of this.scene.materials) {
			mat.unfreeze();
			if (mat instanceof BABYLON.MultiMaterial) {
				for (const subMat of mat.subMaterials) {
					if (subMat.metadata?.useEnvMap) subMat.reflectionTexture = envManager.envMapIndoor;
				}
			} else {
				if (mat.metadata?.useEnvMap) mat.reflectionTexture = envManager.envMapIndoor;
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
		await this.changeEnvType(this.roomState.env.type, this.roomState.env.options, true);
	}

	private async loadFuniture(args: {
		type: string;
		id: string;
		position: BABYLON.Vector3;
		rotation: BABYLON.Vector3;
		options: RawOptions;
	}) {
		const def = getFurnitureDef(args.type);

		const metadata = {
			isFuniture: true,
			furnitureId: args.id,
			funitureType: args.type,
		};

		const container = new FurnitureContainer({
			id: args.id,
			type: args.type,
			position: args.position.clone(),
			rotation: args.rotation.clone(),
			options: args.options,
			roomAttachments: this.roomAttachments,
			sr: this.sr,
			getIsSrReady: () => this.inited,
			lightContainer: this.lightContainer,
			graphicsQuality: this.graphicsQuality,
			scene: this.scene,
			sitChair: () => {
				this.sitChair(args.id);
			},
		});
		container.root.metadata = metadata;
		container.registerMeshes = (meshes) => {
			if (this.selected?.furnitureId === args.id) {
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
									(subMat as BABYLON.PBRMaterial).subSurface.isRefractionEnabled = false; // 有効にするとドローコールが激増する
									(subMat as BABYLON.PBRMaterial).transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
									(subMat as BABYLON.PBRMaterial).alpha = 0.5;
									(subMat as BABYLON.PBRMaterial).metallic = 1;
								}
								(subMat as BABYLON.PBRMaterial).reflectionTexture = this.envManager?.envMapIndoor;
								if ((subMat as BABYLON.PBRMaterial).metadata == null) (subMat as BABYLON.PBRMaterial).metadata = {};
								(subMat as BABYLON.PBRMaterial).metadata.useEnvMap = true;
								(subMat as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
								(subMat as BABYLON.PBRMaterial).anisotropy.isEnabled = false; // なんかきれいにレンダリングされないため
							}
						} else {
							if ((mesh.material as BABYLON.PBRMaterial).subSurface.isRefractionEnabled) {
								(mesh.material as BABYLON.PBRMaterial).subSurface.isRefractionEnabled = false; // 有効にするとドローコールが激増する
								(mesh.material as BABYLON.PBRMaterial).transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
								(mesh.material as BABYLON.PBRMaterial).alpha = 0.5;
								(mesh.material as BABYLON.PBRMaterial).metallic = 1;
							}
							(mesh.material as BABYLON.PBRMaterial).reflectionTexture = this.envManager?.envMapIndoor;
							if ((mesh.material as BABYLON.PBRMaterial).metadata == null) (mesh.material as BABYLON.PBRMaterial).metadata = {};
							(mesh.material as BABYLON.PBRMaterial).metadata.useEnvMap = true;
							(mesh.material as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
							(mesh.material as BABYLON.PBRMaterial).anisotropy.isEnabled = false; // なんかきれいにレンダリングされないため
						}
					}
				}

				if (!this.scene.meshes.includes(mesh)) this.scene.addMesh(mesh);
			}

			if (def.hasCollisions) {
				enableFunitureCollision(meshes);
			}

			/* なんかバグる
			for (const mesh of meshes) {
				if (mesh.checkCollisions || SYSTEM_MESH_NAMES.some(n => mesh.name.includes(n))) continue;

				// コリジョンや(ray) pickingに使わないメッシュの頂点情報はCPU側に保持しておく必要がない(通常のpickingはGPUPickerを使えるのでCPUは関与しない)
				mesh.geometry.clearCachedData();
			}
			*/
		};

		await container.load();

		container!.model!.bakeMesh();

		if (def.hasCollisions) {
			enableFunitureCollision(container.root.getChildMeshes());
		}

		this.furnitureContainers.set(args.id, container);

		return container;
	}

	public cameraMove(vector: { x: number; y: number; }, dash: boolean) {
		(this.camera.inputs.attached.manual as FreeCameraManualInput).setMoveVector(dash ? { x: vector.x * 3, y: vector.y * 3 } : vector);
	}

	public cameraJoystickMove(vector: { x: number; y: number; }) {
		(this.camera.inputs.attached.manual as FreeCameraManualInput).setMoveVector(vector);
	}

	public selectFuniture(furnitureId: string | null) {
		this.sr.disableSnapshotRendering(); // snapshot rendering中にbake/unbakeするとエラーになる。なおこのメソッドは参照カウント方式な点に留意

		const currentSelected = this.selected;
		if (currentSelected != null) {
			this.selected = null;
			this.clearHighlight();
			currentSelected.furnitureContainer.model.bakeMesh();
		}

		if (furnitureId != null) {
			const container = this.furnitureContainers.get(furnitureId);
			if (container != null) {
				container.model.unbakeMesh();
				this.highlightMeshes(container.root.getChildMeshes());
				const state = this.roomState.installedFurnitures.find(o => o.id === furnitureId)!;
				this.selected = {
					furnitureId,
					furnitureContainer: container,
					funitureState: state,
					funitureDef: getFurnitureDef(state.type),
				};
			}
		}

		this.sr.enableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
	}

	private previousGridPlanePosition: BABYLON.Vector3 | null = null;

	private handleGrabbing() {
		if (this.grabbingCtx == null) return;
		const grabbing = this.grabbingCtx;

		const placement = getFurnitureDef(grabbing.funitureType).placement;

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

		const bb = grabbing.mesh.getHierarchyBoundingVectors(true);
		// shift coordinate to center
		const rootPos = grabbing.mesh.getAbsolutePosition();
		bb.min.subtractInPlace(rootPos);
		bb.max.subtractInPlace(rootPos);

		let stickyOtherFuniture: string | null = null;
		let stickyPlaneId: string | null = null;
		let sticky = false;

		const isCollisionTarget = (m: BABYLON.AbstractMesh) => {
			return m.metadata?.furnitureId !== grabbing.furnitureId &&
				!m.metadata?.isGhost &&
				!grabbing.descendantStickyFunitureIds.includes(m.metadata?.furnitureId);
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
					stickyOtherFuniture = hit.pickedMesh.metadata?.furnitureId ?? null;
					stickyPlaneId = hit.pickedMesh.name.includes('<') ? hit.pickedMesh.name.split('<')[1].split('>')[0] : null;

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
					stickyOtherFuniture = hit.pickedMesh.metadata?.furnitureId ?? null;
					stickyPlaneId = hit.pickedMesh.name.includes('<') ? hit.pickedMesh.name.split('<')[1].split('>')[0] : null;

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
					//const newBb = {
					//	min: bb.min.add(hit.pickedPoint),
					//	max: bb.max.add(hit.pickedPoint),
					//};
					//let collidedAnotherBb = false;
					//for (const c of this.furnitureContainers.values()) {
					//	if (c.id === grabbing.furnitureId) continue;
					//	if (hit.pickedMesh.metadata?.furnitureId != null) { // TODO: sitkcy先が同じ家具かどうかではなく、同じ家具の同じ面かどうかを判定しないと同じ家具の異なる棚にある家具同士で干渉することになる
					//		const def = this.roomState.installedFurnitures.find(o => o.id === c.id);
					//		if (def.sticky !== hit.pickedMesh.metadata.furnitureId) continue;
					//	}
					//	const cBb = c.boundingBox;
					//	if (intersectBoundingBoxes(newBb, cBb)) {
					//		collidedAnotherBb = true;
					//		break;
					//	}
					//}
					//if (collidedAnotherBb) continue;

					sticky = true;
					newPos = hit.pickedPoint;
					stickyOtherFuniture = hit.pickedMesh.metadata?.furnitureId ?? null;
					stickyPlaneId = hit.pickedMesh.name.includes('<') ? hit.pickedMesh.name.split('<')[1].split('>')[0] : null;

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

			this.sr.updateMesh(grabbing.mesh.getChildMeshes().filter(m => m.isEnabled())); // disabledなmeshを除外しておかないと、後々unbakeMeshのsetEnabled(true)が呼ばれたときにエンジンがクラッシュする
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
			stickyFurnitureId: stickyOtherFuniture,
			stickyPlaneId: stickyPlaneId,
		});
	}

	private getPutParticleSystem() {
		if (this.putParticleSystem != null) return this.putParticleSystem;
		this.sr.disableSnapshotRendering();
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
		this.sr.fixParticleSystem(this.putParticleSystem);
		this.sr.enableSnapshotRendering();
		return this.putParticleSystem;
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

	public beginSelectedInstalledFunitureGrabbing() {
		if (this.selected == null) return;

		this.sr.disableSnapshotRendering();

		const selectedFuniture = this.selected.furnitureContainer.root;
		this.clearHighlight();

		const initialPosition = selectedFuniture.position.clone();
		const initialRotation = selectedFuniture.rotation.clone();

		// 子から先に適用していく
		const setStickyParentRecursively = (mesh: BABYLON.AbstractMesh) => {
			const stickyFunitureIds = Array.from(this.roomState.installedFurnitures.filter(o => o.sticky === mesh.metadata.furnitureId)).map(o => o.id);
			for (const soid of stickyFunitureIds) {
				const soMesh = this.furnitureContainers.get(soid)!.root;
				setStickyParentRecursively(soMesh);
				soMesh.setParent(mesh);
				soMesh.unfreezeWorldMatrix();
				for (const m of soMesh.getChildMeshes()) {
					m.unfreezeWorldMatrix();
				}
			}
		};
		setStickyParentRecursively(selectedFuniture);

		const descendantStickyFunitureIds: string[] = [];
		const collectDescendantStickyFunitureIds = (parentId: string) => {
			const childIds = Array.from(this.roomState.installedFurnitures.filter(o => o.sticky === parentId)).map(o => o.id);
			for (const cid of childIds) {
				descendantStickyFunitureIds.push(cid);
				collectDescendantStickyFunitureIds(cid);
			}
		};
		collectDescendantStickyFunitureIds(selectedFuniture.metadata.furnitureId);

		const placement = getFurnitureDef(selectedFuniture.metadata.funitureType).placement;

		if (placement === 'top') {
			// stickyな場合にsticky先とのレイの距離が0になりstickyされていない初期状態でgrabbingが始まってしまうのでちょっと浮かす
			selectedFuniture.position.y += cm(1);
		}

		const distance = BABYLON.Vector3.Distance(this.camera.position, selectedFuniture.position);
		const ghost = this.createGhost(selectedFuniture);

		const dir = this.camera.getDirection(BABYLON.Axis.Z).scale(this.scene.useRightHandedSystem ? -1 : 1);

		let stickyFurnitureId: string | null;
		let stickyPlaneId: string | null;
		let grabbingEnded = false;

		this.grabbingCtx = {
			furnitureId: selectedFuniture.metadata.furnitureId,
			funitureType: selectedFuniture.metadata.funitureType,
			forInstall: false,
			mesh: selectedFuniture,
			originalDiffOfPosition: selectedFuniture.position.subtract(this.camera.position.add(dir.scale(distance))),
			originalDiffOfRotation: selectedFuniture.rotation.subtract(this.camera.rotation),
			distance: distance,
			rotation: 0,
			ghost: ghost,
			descendantStickyFunitureIds,
			onMove: (info) => {
				stickyFurnitureId = info.stickyFurnitureId;
				stickyPlaneId = info.stickyPlaneId;
			},
			onCancel: () => {
				grabbingEnded = true;
				this.sr.disableSnapshotRendering();
				selectedFuniture.position = initialPosition.clone();
				selectedFuniture.rotation = initialRotation.clone();

				// 親から先に外していく
				const removeStickyParentRecursively = (mesh: BABYLON.Mesh) => {
					const stickyFunitureIds = Array.from(this.roomState.installedFurnitures.filter(o => o.sticky === mesh.metadata.furnitureId)).map(o => o.id);
					for (const soid of stickyFunitureIds) {
						const soMesh = this.furnitureContainers.get(soid)!.root;
						soMesh.setParent(null);

						removeStickyParentRecursively(soMesh);
					}
				};
				removeStickyParentRecursively(selectedFuniture);
				this.sr.enableSnapshotRendering();

				this.furnitureContainers.get(selectedFuniture.metadata.furnitureId)!.calcBoundingBox();

				this.envManager.renderShadow();
			},
			onDone: () => { // todo: sticky状態などを引数でもらうようにしたい
				grabbingEnded = true;

				// 場合によってはなぜかSRが効かなくなる
				//const putParticleSystem = this.getPutParticleSystem();
				//putParticleSystem.emitter = selectedFuniture.position.clone();
				//putParticleSystem.start();

				this.playSfxUrl('/client-assets/room/sfx/put.mp3', {
					volume: 1,
					playbackRate: 1,
				});

				// put animation
				selectedFuniture.animations.push(placement === 'side' || placement === 'wall' ? this.putAnimH : this.putAnimV);
				const animating = Promise.withResolvers<void>();
				const animationObserver = this.scene.onAfterAnimationsObservable.add(() => {
					this.sr.updateMesh(selectedFuniture.getChildMeshes().filter(m => m.isEnabled()), true);
				});
				this.scene.beginAnimation(selectedFuniture, 0, 60, false, 3, () => { animating.resolve(); });

				// TODO: アニメーションの完了まで親子関係の解除を遅延するため、一瞬「grabbingが終わっているのに親子関係が解除されていない」状態が発生する。その間に新たにgrabbingを開始するなどの別の操作が発生すると不具合のもとになるのでそれを防止する仕組みを作る
				animating.promise.then(() => {
					this.scene.onAfterAnimationsObservable.remove(animationObserver);

					// 親から先に外していく
					const removeStickyParentRecursively = (mesh: BABYLON.Mesh) => {
						const stickyFunitureIds = Array.from(this.roomState.installedFurnitures.filter(o => o.sticky === mesh.metadata.furnitureId)).map(o => o.id);
						for (const soid of stickyFunitureIds) {
							const soMesh = this.furnitureContainers.get(soid)!.root;
							soMesh.setParent(null);

							const pos = soMesh.position.clone();
							const rotation = soMesh.rotation.clone();
							this.roomState.installedFurnitures.find(o => o.id === soid)!.position = [pos.x, pos.y, pos.z];
							this.roomState.installedFurnitures.find(o => o.id === soid)!.rotation = [rotation.x, rotation.y, rotation.z];

							removeStickyParentRecursively(soMesh);
						}
					};
					removeStickyParentRecursively(selectedFuniture);

					this.furnitureContainers.get(selectedFuniture.metadata.furnitureId)!.calcBoundingBox();

					this.envManager.renderShadow();

					const pos = selectedFuniture.position.clone();
					const rotation = selectedFuniture.rotation.clone();
					this.roomState.installedFurnitures.find(o => o.id === selectedFuniture.metadata.furnitureId)!.sticky = stickyFurnitureId;
					this.roomState.installedFurnitures.find(o => o.id === selectedFuniture.metadata.furnitureId)!.stickyPlaneId = stickyPlaneId;
					this.roomState.installedFurnitures.find(o => o.id === selectedFuniture.metadata.furnitureId)!.position = [pos.x, pos.y, pos.z];
					this.roomState.installedFurnitures.find(o => o.id === selectedFuniture.metadata.furnitureId)!.rotation = [rotation.x, rotation.y, rotation.z];

					this.ev('changeRoomState', { roomState: this.roomState });
				});
			},
		};

		this.gridPlane.isVisible = true;

		//for (const furniture of this.furnitureContainers.values()) {
		//	console.log(furniture.type, 'min', furniture.boundingBox.min, 'max', furniture.boundingBox.max);
		//	const minSphere = BABYLON.MeshBuilder.CreateSphere('', { diameter: cm(1) }, this.scene);
		//	minSphere.position = furniture.boundingBox.min;
		//	const maxSphere = BABYLON.MeshBuilder.CreateSphere('', { diameter: cm(1) }, this.scene);
		//	maxSphere.position = furniture.boundingBox.max;
		//}

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

	public interact(oid: string, iid: string | null = null) {
		const o = this.roomState.installedFurnitures.find(o => o.id === oid)!;
		const entity = this.furnitureContainers.get(o.id)!;

		if (iid == null) {
			if (entity.instance.primaryInteraction != null) {
				entity.instance.interactions[entity.instance.primaryInteraction].fn();
			}
		} else {
			entity.instance.interactions[iid].fn();
		}
	}

	public sitChair(furnitureId: string) {
		this.isSitting = true;
		this.fixedCamera.parent = this.furnitureContainers.get(furnitureId)!.root;
		this.fixedCamera.position = new BABYLON.Vector3(0, cm(120), 0);
		this.fixedCamera.rotation = new BABYLON.Vector3(0, 0, 0);
		this.scene.activeCamera = this.fixedCamera;
		this.selectFuniture(null);
	}

	public sit() {
		this.isSitting = true;
		this.sr.disableSnapshotRendering();
		this.fixedCamera.parent = null;
		this.fixedCamera.position = new BABYLON.Vector3(this.camera.position.x, cm(70), this.camera.position.z);
		this.fixedCamera.rotation = new BABYLON.Vector3(this.camera.rotation.x, this.camera.rotation.y, this.camera.rotation.z);
		this.scene.activeCamera = this.fixedCamera;
		this.sr.enableSnapshotRendering();
	}

	public lyingDown() {
		this.isSitting = true;
		this.sr.disableSnapshotRendering();
		this.fixedCamera.parent = null;
		this.fixedCamera.position = new BABYLON.Vector3(this.camera.position.x, cm(20), this.camera.position.z);
		this.fixedCamera.rotation = new BABYLON.Vector3(-(Math.PI / 2) + 0.001, this.camera.rotation.y, this.camera.rotation.z);
		this.scene.activeCamera = this.fixedCamera;
		this.sr.enableSnapshotRendering();
	}

	public standUp() {
		this.isSitting = false;
		this.scene.activeCamera = this.camera;
		this.fixedCamera.parent = null;
	}

	public updateLightSettings(light: RoomState['light']) {
		this.roomState.light = light;
		this.ev('changeRoomState', { roomState: this.roomState });
		this.sr.disableSnapshotRendering();
		this.envManager.applyRoomLight();
		this.sr.enableSnapshotRendering();
	}

	public turnOnRoomLight(forInit = false) {
		if (!forInit) this.sr.disableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
		this.envManager.turnOnRoomLight();
		if (!forInit) {
			// workerで実行される可能性がある

			setTimeout(() => {
				this.sr.enableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
			}, 10);
		}
	}

	public turnOffRoomLight() {
		this.sr.disableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
		this.envManager.turnOffRoomLight();
		// workerで実行される可能性がある

		setTimeout(() => {
			this.sr.enableSnapshotRendering(); // このメソッドは参照カウント方式な点に留意
		}, 10);
	}

	private createGhost(mesh: BABYLON.Mesh): BABYLON.TransformNode {
		const root = new BABYLON.TransformNode('ghost_root', this.scene);

		const arrowGhost = BABYLON.MeshBuilder.CreateCylinder('', { height: cm(10), diameterBottom: cm(5), diameterTop: 0, tessellation: 8 }, this.scene);
		arrowGhost.parent = root;
		const arrowGhostMat = new BABYLON.StandardMaterial('', this.scene);
		arrowGhostMat.emissiveColor = new BABYLON.Color3(0, 1, 0);
		arrowGhostMat.alpha = 0.5;
		arrowGhostMat.disableLighting = true;
		arrowGhost.material = arrowGhostMat;

		return root;
	}

	public async addFuniture(type: string, _options?: RawOptions, attachments?: RoomAttachments) {
		if (!this.isEditMode) return;
		if (this.grabbingCtx != null) return;

		if (attachments != null) this.roomAttachments = attachments;
		this.selectFuniture(null);

		const id = genId();
		const def = getFurnitureDef(type);
		const options = _options != null ? deepClone(_options) : deepClone(def.options.default);

		const container = await this.loadFuniture({
			id: id,
			type,
			position: new BABYLON.Vector3(0, 0, 0),
			rotation: new BABYLON.Vector3(0, Math.PI, 0),
			options,
		});

		container.root.unfreezeWorldMatrix();
		for (const m of container.root.getChildMeshes()) {
			m.unfreezeWorldMatrix();
			m.checkCollisions = false;
		}

		const ghost = this.createGhost(container.root);
		const distance = cm(50);

		let stickyFurnitureId: string | null;
		let stickyPlaneId: string | null;
		let grabbingEnded = false;

		this.grabbingCtx = {
			furnitureId: id,
			funitureType: type,
			forInstall: true,
			mesh: container.root,
			originalDiffOfPosition: new BABYLON.Vector3(0, 0, 0),
			originalDiffOfRotation: new BABYLON.Vector3(0, Math.PI, 0),
			distance: distance,
			rotation: 0,
			ghost: ghost,
			descendantStickyFunitureIds: [],
			onMove: (info) => {
				stickyFurnitureId = info.stickyFurnitureId;
				stickyPlaneId = info.stickyPlaneId;
			},
			onCancel: () => {
				grabbingEnded = true;
				// todo
			},
			onDone: () => { // todo: sticky状態などを引数でもらうようにしたい
				grabbingEnded = true;

				if (def.hasCollisions) {
					enableFunitureCollision(container.root.getChildMeshes());
				}

				const pos = container.root.position.clone();
				const rotation = container.root.rotation.clone();

				// 場合によってはなぜかSRが効かなくなる
				//const putParticleSystem = this.getPutParticleSystem();
				//putParticleSystem.emitter = pos;
				//putParticleSystem.start();

				this.playSfxUrl('/client-assets/room/sfx/put.mp3', {
					volume: 1,
					playbackRate: 1,
				});

				// put animation
				container.root.animations.push(def.placement === 'side' || def.placement === 'wall' ? this.putAnimH : this.putAnimV);
				const animationObserver = this.scene.onAfterAnimationsObservable.add(() => {
					this.sr.updateMesh(container.root.getChildMeshes().filter(m => m.isEnabled()), true); // disabledなmeshを除外しておかないと、後々unbakeMeshのsetEnabled(true)が呼ばれたときにエンジンがクラッシュする
				});
				this.scene.beginAnimation(container.root, 0, 60, false, 3, () => {
					this.scene.onAfterAnimationsObservable.remove(animationObserver);

					this.envManager.renderShadow();
				});

				container.calcBoundingBox();

				this.roomState.installedFurnitures.push({
					id,
					type,
					position: [pos.x, pos.y, pos.z],
					rotation: [rotation.x, rotation.y, rotation.z],
					sticky: stickyFurnitureId,
					stickyPlaneId,
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

		for (const entity of this.furnitureContainers.values()) {
			entity.instance.resetTemporaryState?.();
		}

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
		this.selectFuniture(null);
		this.isEditMode = false;

		await this.envManager.renderShadow();

		await this.bake();
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

		for (const mesh of this.scene.meshes.filter(m => (m instanceof BABYLON.Mesh || m instanceof BABYLON.InstancedMesh) && m.isEnabled() && m.isVisible && m.material && m.metadata?.isFuniture)) {
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

	public duplicateSelectedFuniture() {
		if (this.selected == null) return;

		const funitureState = this.selected.funitureState;

		this.addFuniture(funitureState.type, deepClone(funitureState.options));
	}

	public removeSelectedFuniture() {
		if (this.selected == null) return;

		const furnitureId = this.selected.furnitureId;

		this.furnitureContainers.get(furnitureId)?.destroy();
		this.furnitureContainers.delete(furnitureId);
		this.roomState.installedFurnitures = this.roomState.installedFurnitures.filter(o => o.id !== furnitureId);
		for (const o of this.roomState.installedFurnitures.filter(o => o.sticky === furnitureId)) {
			o.sticky = null;
			o.stickyPlaneId = null;
		}
		this.ev('changeRoomState', { roomState: this.roomState });
		this.selected = null;

		this.envManager.renderShadow();

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

	public updateFurnitureOption(furnitureId: string, key: string, value: any, attachments?: RoomAttachments) {
		if (attachments != null) {
			this.roomAttachments = attachments;
		}

		const o = this.roomState.installedFurnitures.find(o => o.id === furnitureId);
		if (o == null) return;

		o.options[key] = value;

		this.ev('changeRoomState', { roomState: this.roomState });

		const container = this.furnitureContainers.get(furnitureId);
		if (container == null) return;

		container.optionsUpdated(o.options, key, value, this.roomAttachments);
	}

	public updateEnvOptions(options: RoomState['env']['options']) {
		this.roomState.env.options = options;
		this.sr.disableSnapshotRendering();
		this.envManager.applyOptions(options);
		this.envManager.renderShadow();
		this.sr.enableSnapshotRendering();
		this.ev('changeRoomState', { roomState: this.roomState });
	}

	private playSfxUrl(url: string, options: { volume: number; playbackRate: number }) {
		this.ev('playSfxUrl', { url, options });
	}

	public updatePlayerProfiles(profiles: Record<string, PlayerProfile>) {
		this.playerProfiles = profiles;

		for (const playerContainer of this.playerContainers) {
			if (this.playerProfiles[playerContainer.id] == null) {
				this.sr.disableSnapshotRendering();
				playerContainer.destroy();
				this.sr.enableSnapshotRendering();
			}
		}
		this.playerContainers = this.playerContainers.filter(p => this.playerProfiles[p.id] != null);
	}

	public updatePlayerStates(states: Record<string, PlayerState>) {
		for (const [k, v] of Object.entries(this.playerProfiles)) {
			const playerContainer = this.playerContainers.find(p => p.id === k);
			if (playerContainer == null) {
				const p = new PlayerContainer({
					id: k,
					profile: v,
					state: states[k],
					scene: this.scene,
					sr: this.sr,
					showUsername: this.showUsernameOnAvatar,
					show2dAvatar: this.show2dAvatarOnAvatar,
				});
				// TODO: loadFunitureのものとある程度共通化
				p.registerMeshes = (meshes) => {
					for (const mesh of meshes) {
						mesh.receiveShadows = false;
						if (SYSTEM_MESH_NAMES.some(n => mesh.name.includes(n))) {
							mesh.isVisible = false;
						} else {
							mesh.metadata = { isPlayer: true, playerId: k };

							//if (mesh.material) (mesh.material as BABYLON.PBRMaterial).ambientColor = new BABYLON.Color3(0.2, 0.2, 0.2);
							if (mesh.material) {
								if (mesh.material instanceof BABYLON.MultiMaterial) {
									for (const subMat of mesh.material.subMaterials) {
										if ((subMat as BABYLON.PBRMaterial).subSurface.isRefractionEnabled) {
											(subMat as BABYLON.PBRMaterial).subSurface.isRefractionEnabled = false; // 有効にするとドローコールが激増する
											(subMat as BABYLON.PBRMaterial).transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
											(subMat as BABYLON.PBRMaterial).alpha = 0.5;
											(subMat as BABYLON.PBRMaterial).metallic = 1;
										}
										(subMat as BABYLON.PBRMaterial).reflectionTexture = this.envManager?.envMapIndoor;
										if ((subMat as BABYLON.PBRMaterial).metadata == null) (subMat as BABYLON.PBRMaterial).metadata = {};
										(subMat as BABYLON.PBRMaterial).metadata.useEnvMap = true;
										(subMat as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
										(subMat as BABYLON.PBRMaterial).anisotropy.isEnabled = false; // なんかきれいにレンダリングされないため
									}
								} else {
									if ((mesh.material as BABYLON.PBRMaterial).subSurface.isRefractionEnabled) {
										(mesh.material as BABYLON.PBRMaterial).subSurface.isRefractionEnabled = false; // 有効にするとドローコールが激増する
										(mesh.material as BABYLON.PBRMaterial).transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
										(mesh.material as BABYLON.PBRMaterial).alpha = 0.5;
										(mesh.material as BABYLON.PBRMaterial).metallic = 1;
									}
									(mesh.material as BABYLON.PBRMaterial).reflectionTexture = this.envManager?.envMapIndoor;
									if ((mesh.material as BABYLON.PBRMaterial).metadata == null) (mesh.material as BABYLON.PBRMaterial).metadata = {};
									(mesh.material as BABYLON.PBRMaterial).metadata.useEnvMap = true;
									(mesh.material as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
									(mesh.material as BABYLON.PBRMaterial).anisotropy.isEnabled = false; // なんかきれいにレンダリングされないため
								}
							}
						}

						if (!this.scene.meshes.includes(mesh)) this.scene.addMesh(mesh);
					}
				};
				p.loadAvatar().then(() => {
					this.sr.disableSnapshotRendering();
					this.sr.enableSnapshotRendering();
				});
				this.playerContainers.push(p);
			} else {
				if (states[k] != null) {
					playerContainer.applyState(states[k]);
				}
			}
		}
	}

	public clearPlayers() {
		this.sr.disableSnapshotRendering();
		for (const playerContainer of this.playerContainers) {
			playerContainer.destroy();
		}
		this.sr.enableSnapshotRendering();
		this.playerContainers = [];
	}

	public updateAvatarDisplayOptions(options: { showUsername: boolean; show2dAvatar: boolean }) {
		this.showUsernameOnAvatar = options.showUsername;
		this.show2dAvatarOnAvatar = options.show2dAvatar;

		this.sr.disableSnapshotRendering();
		for (const playerContainer of this.playerContainers) {
			playerContainer.updateUserInfoDisplayOptions(options);
		}
		this.sr.enableSnapshotRendering();
	}

	public resize() {
		// 一旦snapshot renderingを無効にしておかないとエラーが出る
		// ~~...が、一旦無効にしたらしたで複数のマテリアルがそれぞれ入れ替わる(?)という謎の現象が発生するためコメントアウトしとく(エラー出てもレンダリングが止まったりするわけでもないし)~~
		// ↑追記: engine.resizeした後に一瞬待つことで回避できることが判明
		this.sr.disableSnapshotRendering();
		this.engine.resize(true);
		// workerで実行される可能性がある

		setTimeout(() => {
			this.sr.enableSnapshotRendering();
		}, 1);
	}

	public destroy() {
		super.destroy();
		this.timer.dispose();
		this.envManager.dispose();
		for (const container of this.furnitureContainers.values()) {
			container.destroy();
		}
		this.furnitureContainers.clear();
	}
}
