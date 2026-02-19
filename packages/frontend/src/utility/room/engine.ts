/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * Roomで使われるオブジェクトの仕様
 * - 単位はセンチメートルで設計すること。
 * - それを置いたときに底になる縦軸座標(blenderならz)が0になるように設計すること。
 * - 壁面設置の場合は壁面に接する面のY軸座標が0になるように設計すること。
 * - メッシュ名を __TOP__ で始めると、その面の上にモノを置けることを示す。当該メッシュはレンダリングでは表示されません。
 * - メッシュ名を __SIDE__ で始めると、その面にモノを貼り付けられることを示す。当該メッシュはレンダリングでは表示されません。
 * - なお、現状 __TOP__ / __SIDE__ メッシュは単一の面でなければなりません。つまりArray Modifierなどを適用した状態では正しく動作しません。
 * - メッシュ名を __COLLISION__ で始めると、コリジョン用メッシュとして扱われます。このメッシュはシーク時のレイのヒットチェックにも使われます。当該メッシュはレンダリングでは表示されません。
 * - コリジョン用メッシュが無い場合、すべてのメッシュがコリジョン用メッシュとして扱われますが、例えば網目のようなメッシュではレイが隙間を通り抜けて後ろにあるオブジェクトにヒットしてしまうなどの問題が発生します。
 */

// TODO: 家具設置時のコリジョン判定(めりこんで設置されないようにする)
// TODO: 近くのオブジェクトの端にスナップオプション
// TODO: 近くのオブジェクトの原点に軸を揃えるオプション

import * as BABYLON from '@babylonjs/core';
import { AxesViewer } from '@babylonjs/core/Debug/axesViewer';
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic';
import { BoundingBoxRenderer } from '@babylonjs/core/Rendering/boundingBoxRenderer';
import { GridMaterial } from '@babylonjs/materials';
import { ShowInspector } from '@babylonjs/inspector';
import { reactive, ref, watch } from 'vue';
import { genId } from '../id.js';
import { getObjectDef } from './object-defs.js';
import { HorizontalCameraKeyboardMoveInput } from './utility.js';
import * as sound from '@/utility/sound.js';

// babylonのドメイン知識は持たない
type RoomStateObject<Options = any> = {
	id: string;
	type: string;
	position: [number, number, number];
	rotation: [number, number, number];
	options: Options;
	isMainLight?: boolean;

	/**
	 * 別のオブジェクトのID
	 */
	sticky?: string | null;
};

type RoomState = {
	roomType: 'default';
	installedObjects: RoomStateObject<any>[];
};

type RoomObjectInstance<Options> = {
	onInited?: (room: RoomEngine, o: RoomStateObject<Options>, rootNode: BABYLON.Mesh) => void;
	interactions: Record<string, {
		label: string;
		fn: () => void;
	}>;
	primaryInteraction?: string | null;
	dispose?: () => void;
};

export const WORLD_SCALE = 100;

type ColorOptionSchema = {
	type: 'color';
	label: string;
};

type SelectOptionSchema = {
	type: 'select';
	label: string;
	enum: string[];
};

type OptionsSchema = Record<string, ColorOptionSchema | SelectOptionSchema>;

type GetOptionsSchemaValues<T extends OptionsSchema> = {
	[K in keyof T]: T[K] extends ColorOptionSchema ? [number, number, number] : T[K] extends SelectOptionSchema ? T[K]['enum'][number] : never;
};

type ObjectDef<OpSc extends OptionsSchema> = {
	id: string;
	optionsSchema: OpSc;
	defaultOptions: GetOptionsSchemaValues<OpSc>;
	placement: 'top' | 'side' | 'bottom' | 'wall' | 'ceiling' | 'floor';
	isChair?: boolean;
	createInstance: (args: {
		room: RoomEngine;
		root: BABYLON.Mesh;
		options: GetOptionsSchemaValues<OpSc>;
		loaderResult: BABYLON.ISceneLoaderAsyncResult;
		meshUpdated: () => void;
	}) => RoomObjectInstance<GetOptionsSchemaValues<OpSc>>;
};

export function defineObject<const OpSc extends OptionsSchema>(def: ObjectDef<OpSc>): ObjectDef<OpSc> {
	return def;
}

// この実装方法だとマイナスの座標をうまく処理できず結果がおかしくなるので応急処置で全体を+10000cmオフセットしてから計算している
function getMeshesBoundingBox(meshes: BABYLON.Mesh[]): BABYLON.BoundingBox {
	let min = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
	let max = new BABYLON.Vector3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);

	for (const mesh of meshes) {
		const boundingInfo = mesh.getBoundingInfo();
		min = BABYLON.Vector3.Minimize(min, boundingInfo.boundingBox.minimumWorld.add(new BABYLON.Vector3(10000, 10000, 10000)));
		max = BABYLON.Vector3.Maximize(max, boundingInfo.boundingBox.maximumWorld.add(new BABYLON.Vector3(10000, 10000, 10000)));
	}

	return new BABYLON.BoundingBox(min.subtract(new BABYLON.Vector3(10000, 10000, 10000)), max.subtract(new BABYLON.Vector3(10000, 10000, 10000)));
}

const TIME_MAP = {
	0: 2,
	1: 2,
	2: 2,
	3: 2,
	4: 2,
	5: 1,
	6: 1,
	7: 0,
	8: 0,
	9: 0,
	10: 0,
	11: 0,
	12: 0,
	13: 0,
	14: 0,
	15: 0,
	16: 1,
	17: 1,
	18: 2,
	19: 2,
	20: 2,
	21: 2,
	22: 2,
	23: 2,
} as const;

export class RoomEngine {
	private canvas: HTMLCanvasElement;
	private engine: BABYLON.Engine;
	public scene: BABYLON.Scene;
	private shadowGenerator1: BABYLON.ShadowGenerator;
	private shadowGenerator2: BABYLON.ShadowGenerator;
	private camera: BABYLON.UniversalCamera;
	private fixedCamera: BABYLON.UniversalCamera;
	private birdeyeCamera: BABYLON.ArcRotateCamera;
	public intervalIds: number[] = [];
	public timeoutIds: number[] = [];
	private objectMeshs: Map<string, BABYLON.Mesh> = new Map();
	public objectInstances: Map<string, RoomObjectInstance<any>> = new Map();
	private grabbingCtx: {
		objectId: string;
		objectType: string;
		mesh: BABYLON.Mesh;
		originalDiffOfPosition: BABYLON.Vector3;
		originalDiffOfRotationY: number;
		distance: number;
		rotation: number;
		ghost: BABYLON.AbstractMesh;
		descendantStickyObjectIds: string[];
		isMainLight: boolean;
		onMove?: (info: { position: BABYLON.Vector3; rotation: BABYLON.Vector3; sticky: string | null; }) => void;
		onCancel?: () => void;
		onDone?: () => void;
	} | null = null;
	public selectedObjectId = ref<string | null>(null);
	private time: 0 | 1 | 2 = 0; // 0: 昼, 1: 夕, 2: 夜
	private roomCollisionMeshes: BABYLON.AbstractMesh[] = [];
	public roomState: RoomState;
	public enableGridSnapping = ref(true);
	public gridSnappingScale = ref(8/*cm*/);
	private putParticleSystem: BABYLON.ParticleSystem;
	private envMapIndoor: BABYLON.CubeTexture;
	private envMapOutdoor: BABYLON.CubeTexture;
	private reflectionProbe: BABYLON.ReflectionProbe;
	private roomLight: BABYLON.SpotLight;
	private enableReflectionProbe = false;
	private xGridPreviewPlane: BABYLON.Mesh;
	private yGridPreviewPlane: BABYLON.Mesh;
	private zGridPreviewPlane: BABYLON.Mesh;
	public isEditMode = ref(false);
	public isSitting = ref(false);
	public ui = reactive({
		isGrabbing: false,
		isGrabbingForInstall: false,
	});

	constructor(roomState: RoomState, options: {
		canvas: HTMLCanvasElement;
	}) {
		this.roomState = roomState;
		this.canvas = options.canvas;

		registerBuiltInLoaders();

		this.engine = new BABYLON.Engine(options.canvas, false, { alpha: false });
		this.scene = new BABYLON.Scene(this.engine);
		//this.scene.useRightHandedSystem = true;

		if (_DEV_) {
			new BoundingBoxRenderer(this.scene);
		}

		this.time = TIME_MAP[new Date().getHours() as keyof typeof TIME_MAP];

		//this.scene.autoClear = true;
		if (this.time === 0) {
			this.scene.clearColor = new BABYLON.Color4(0.7, 0.9, 1.0, 0);
		} else if (this.time === 1) {
			this.scene.clearColor = new BABYLON.Color4(0.8, 0.5, 0.3, 0);
		} else {
			this.scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.2, 0);
		}
		this.scene.ambientColor = new BABYLON.Color3(1.0, 0.9, 0.8);

		this.envMapIndoor = BABYLON.CubeTexture.CreateFromPrefilteredData('/client-assets/room/indoor.env', this.scene);
		this.envMapIndoor.boundingBoxSize = new BABYLON.Vector3(500/*cm*/, 300/*cm*/, 500/*cm*/);

		this.envMapOutdoor = BABYLON.CubeTexture.CreateFromPrefilteredData(this.time === 2 ? '/client-assets/room/outdoor-night.env' : '/client-assets/room/outdoor-day.env', this.scene);
		this.envMapOutdoor.level = this.time === 0 ? 0.5 : this.time === 1 ? 0.3 : 0.1;

		if (this.enableReflectionProbe) {
			this.reflectionProbe = new BABYLON.ReflectionProbe('reflectionProbe', 512, this.scene);
			this.reflectionProbe.position = new BABYLON.Vector3(0, 100/*cm*/, 0);
			this.reflectionProbe.refreshRate = 200;
		}

		//const sphere = BABYLON.MeshBuilder.CreateSphere('', { diameter: 50/*cm*/ }, this.scene);
		//sphere.position = new BABYLON.Vector3(0, 100/*cm*/, 0);
		//const mat = new BABYLON.PBRMaterial('', this.scene);
		//mat.metallic = 1;
		//mat.roughness = 0;
		//mat.reflectionTexture = this.envMapIndoor;
		//mat.reflectionTexture = this.reflectionProbe.cubeTexture;
		//sphere.material = mat;

		this.scene.collisionsEnabled = true;

		this.camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 130/*cm*/, 0/*cm*/), this.scene);
		this.camera.inputs.removeByType('FreeCameraKeyboardMoveInput');
		this.camera.inputs.add(new HorizontalCameraKeyboardMoveInput(this.camera));
		this.camera.attachControl(this.canvas);
		this.camera.minZ = 1/*cm*/;
		this.camera.maxZ = 100000/*cm*/;
		this.camera.fov = 1;
		this.camera.ellipsoid = new BABYLON.Vector3(15/*cm*/, 65/*cm*/, 15/*cm*/);
		this.camera.checkCollisions = true;
		this.camera.applyGravity = true;
		this.camera.needMoveForGravity = true;

		this.fixedCamera = new BABYLON.UniversalCamera('fixedCamera', new BABYLON.Vector3(0, 0, 0), this.scene);
		this.fixedCamera.minZ = 1/*cm*/;
		this.fixedCamera.maxZ = 100000/*cm*/;
		this.fixedCamera.fov = 1;
		this.fixedCamera.inputs.removeByType('FreeCameraKeyboardMoveInput');
		this.fixedCamera.attachControl(this.canvas);

		this.birdeyeCamera = new BABYLON.ArcRotateCamera('birdeyeCamera', -Math.PI / 2, Math.PI / 2.5, 300/*cm*/, new BABYLON.Vector3(0, 90/*cm*/, 0), this.scene);
		this.birdeyeCamera.attachControl(this.canvas);
		this.birdeyeCamera.minZ = 1/*cm*/;
		this.birdeyeCamera.maxZ = 100000/*cm*/;
		this.birdeyeCamera.fov = 0.5;
		this.birdeyeCamera.lowerBetaLimit = 0;
		this.birdeyeCamera.upperBetaLimit = (Math.PI / 2) + 0.1;
		this.birdeyeCamera.lowerRadiusLimit = 50/*cm*/;
		this.birdeyeCamera.upperRadiusLimit = 1000/*cm*/;

		this.scene.activeCamera = this.camera;

		const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, -0.5), this.scene);
		ambientLight.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
		ambientLight.intensity = 0.5;
		//ambientLight.intensity = 0;

		this.roomLight = new BABYLON.SpotLight('roomLight', new BABYLON.Vector3(0, 249/*cm*/, 0), new BABYLON.Vector3(0, -1, 0), 16, 8, this.scene);
		this.roomLight.diffuse = new BABYLON.Color3(1.0, 0.9, 0.8);
		this.roomLight.shadowMinZ = 10/*cm*/;
		this.roomLight.shadowMaxZ = 300/*cm*/;

		this.shadowGenerator1 = new BABYLON.ShadowGenerator(2048, this.roomLight);
		this.shadowGenerator1.forceBackFacesOnly = true;
		this.shadowGenerator1.bias = 0.0001;
		this.shadowGenerator1.usePercentageCloserFiltering = true;
		this.shadowGenerator1.useContactHardeningShadow = true;

		const sunLight = new BABYLON.DirectionalLight('sunLight', new BABYLON.Vector3(0.2, -1, -1), this.scene);
		sunLight.position = new BABYLON.Vector3(-20, 1000, 1000);
		sunLight.diffuse = this.time === 0 ? new BABYLON.Color3(1.0, 0.9, 0.8) : this.time === 1 ? new BABYLON.Color3(1.0, 0.8, 0.6) : new BABYLON.Color3(0.6, 0.8, 1.0);
		sunLight.intensity = this.time === 0 ? 2 : this.time === 1 ? 1 : 0.25;
		sunLight.shadowMinZ = 1000/*cm*/;
		sunLight.shadowMaxZ = 2000/*cm*/;

		this.shadowGenerator2 = new BABYLON.ShadowGenerator(4092, sunLight);
		this.shadowGenerator2.forceBackFacesOnly = true;
		this.shadowGenerator2.bias = 0.0001;
		this.shadowGenerator2.usePercentageCloserFiltering = true;
		this.shadowGenerator2.usePoissonSampling = true;

		this.turnOnRoomLight();

		const gl = new BABYLON.GlowLayer('glow', this.scene, {
			//mainTextureFixedSize: 512,
			blurKernelSize: 64,
		});
		gl.intensity = 0.5;

		{
			//const postProcess = new BABYLON.ImageProcessingPostProcess('processing', 1.0, this.camera);
			//postProcess.exposure = 1.1;
			//postProcess.contrast = 0.9;

			//const curve = new BABYLON.ColorCurves();
			//curve.highlightsHue = 40;
			//curve.highlightsDensity = 50;
			//curve.highlightsSaturation = 40;
			//curve.shadowsHue = 200;
			//curve.shadowsDensity = 100;
			//curve.shadowsSaturation = 40;
			//postProcess.colorCurvesEnabled = true;
			//postProcess.colorCurves = curve;

			//const postProcess2 = new BABYLON.ImageProcessingPostProcess('processing2', 1.0, this.birdeyeCamera);
			//postProcess2.exposure = 2;
			//postProcess2.contrast = 0.9;

			//const ssao = new BABYLON.SSAORenderingPipeline('ssao', this.scene, {
			//	ssaoRatio: 4,
			//	combineRatio: 1,
			//});
			//ssao.radius = 0.0001;
			//ssao.totalStrength = 0.8;
			//this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline('ssao', this.camera);

			//const lensEffect = new BABYLON.LensRenderingPipeline('lens', {
			//	edge_blur: 1.0,
			//	distortion: 0.5,
			//	dof_focus_distance: 90/*cm*/,
			//	dof_aperture: 6.0,
			//	dof_pentagon: true,
			//	dof_gain: 2.0,
			//	dof_threshold: 1.0,
			//	dof_darken: 0,
			//}, this.scene, 1, [this.camera]);
		}

		this.putParticleSystem = new BABYLON.ParticleSystem('', 64, this.scene);
		this.putParticleSystem.particleTexture = new BABYLON.Texture('/client-assets/room/steam.png');
		this.putParticleSystem.createCylinderEmitter(5/*cm*/, 1/*cm*/, 5/*cm*/);
		this.putParticleSystem.minEmitBox = new BABYLON.Vector3(-3/*cm*/, 0, -3/*cm*/);
		this.putParticleSystem.maxEmitBox = new BABYLON.Vector3(3/*cm*/, 0, 3/*cm*/);
		this.putParticleSystem.minEmitPower = 700;
		this.putParticleSystem.maxEmitPower = 1000;
		this.putParticleSystem.addVelocityGradient(0, 1);
		this.putParticleSystem.addVelocityGradient(1, 0);
		this.putParticleSystem.minLifeTime = 0.2;
		this.putParticleSystem.maxLifeTime = 0.2;
		this.putParticleSystem.minSize = 1/*cm*/;
		this.putParticleSystem.maxSize = 4/*cm*/;
		this.putParticleSystem.emitRate = 256;
		this.putParticleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
		this.putParticleSystem.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
		this.putParticleSystem.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
		this.putParticleSystem.colorDead = new BABYLON.Color4(1, 1, 1, 0);
		this.putParticleSystem.targetStopDuration = 0.05;

		const gridMaterial = new GridMaterial('grid', this.scene);
		gridMaterial.lineColor = new BABYLON.Color3(0.5, 0.5, 0.5);
		gridMaterial.mainColor = new BABYLON.Color3(0, 0, 0);
		gridMaterial.minorUnitVisibility = 1;
		gridMaterial.opacity = 0.5;
		watch(this.gridSnappingScale, (v) => {
			gridMaterial.gridRatio = v;
		}, { immediate: true });

		this.xGridPreviewPlane = BABYLON.MeshBuilder.CreatePlane('xGridPreviewPlane', { width: 1000/*cm*/, height: 1000/*cm*/ }, this.scene);
		this.xGridPreviewPlane.rotation = new BABYLON.Vector3(0, 0, Math.PI / 2);
		this.xGridPreviewPlane.material = gridMaterial;
		this.xGridPreviewPlane.isPickable = false;
		this.xGridPreviewPlane.isVisible = false;

		this.yGridPreviewPlane = BABYLON.MeshBuilder.CreatePlane('yGridPreviewPlane', { width: 1000/*cm*/, height: 1000/*cm*/ }, this.scene);
		this.yGridPreviewPlane.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
		this.yGridPreviewPlane.material = gridMaterial;
		this.yGridPreviewPlane.isPickable = false;
		this.yGridPreviewPlane.isVisible = false;

		this.zGridPreviewPlane = BABYLON.MeshBuilder.CreatePlane('zGridPreviewPlane', { width: 1000/*cm*/, height: 1000/*cm*/ }, this.scene);
		this.zGridPreviewPlane.material = gridMaterial;
		this.zGridPreviewPlane.isPickable = false;
		this.zGridPreviewPlane.isVisible = false;

		let isDragging = false;

		this.canvas.addEventListener('pointerdown', (ev) => {
			this.canvas.setPointerCapture(ev.pointerId);
		});

		this.canvas.addEventListener('pointermove', (ev) => {
			if (this.canvas.hasPointerCapture(ev.pointerId)) {
				isDragging = true;
			}
		});

		this.canvas.addEventListener('pointerup', (ev) => {
			window.setTimeout(() => {
				isDragging = false;
				this.canvas.releasePointerCapture(ev.pointerId);
			}, 0);
		});

		//this.canvas.addEventListener('mousemove', (ev) => {
		//});

		this.canvas.addEventListener('click', (ev) => {
			if (this.grabbingCtx != null) return;
			if (isDragging) return;

			this.selectObject(null);

			const pickingInfo = this.scene.pick(this.scene.pointerX, this.scene.pointerY,
				(m) => m.metadata?.isCollision && m.metadata?.objectId != null && this.objectMeshs.has(m.metadata.objectId));

			if (pickingInfo.pickedMesh != null) {
				const oid = pickingInfo.pickedMesh.metadata.objectId;
				if (oid != null && this.objectMeshs.has(oid)) {
					const o = this.objectMeshs.get(oid)!;
					const boundingInfo = getMeshesBoundingBox(o.getChildMeshes());
					this.camera.setTarget(boundingInfo.center);
					this.selectObject(oid);
				}
			}
		});

		if (_DEV_) {
			const axes = new AxesViewer(this.scene, 30);
			axes.xAxis.position = new BABYLON.Vector3(0, 30, 0);
			axes.yAxis.position = new BABYLON.Vector3(0, 30, 0);
			axes.zAxis.position = new BABYLON.Vector3(0, 30, 0);

			(window as any).showBabylonInspector = () => {
				ShowInspector(this.scene);
			};
		}
	}

	public async init() {
		await this.loadRoomModel(this.roomState.roomType);
		await this.loadEnvModel();
		await Promise.all(this.roomState.installedObjects.map(o => this.loadObject({
			id: o.id,
			type: o.type,
			position: new BABYLON.Vector3(...o.position),
			rotation: new BABYLON.Vector3(o.rotation[0], -o.rotation[1], o.rotation[2]),
			options: o.options,
			isMainLight: o.isMainLight,
		})));

		//const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 1/*cm*/ }, this.scene);

		// update tv texure
		const tvProgramId = 'shopping';
		const tvProgram = TV_PROGRAMS[tvProgramId];
		const tvScreenMaterial = new BABYLON.StandardMaterial('tvScreenMaterial', this.scene);
		tvScreenMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
		tvScreenMaterial.ambientColor = new BABYLON.Color3(0, 0, 0);
		tvScreenMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
		tvScreenMaterial.emissiveTexture = new BABYLON.Texture(`/client-assets/room/tv/${tvProgramId}/${tvProgramId}.png`, this.scene, false, false);
		tvScreenMaterial.emissiveTexture.level = 0.5;
		tvScreenMaterial.emissiveColor = new BABYLON.Color3(0.4, 0.4, 0.4);
		tvScreenMaterial.freeze();

		const applyTvTexture = (tlIndex: number) => {
			const [index, duration] = tvProgram.timeline[tlIndex];
			const tvIds = this.roomState.installedObjects.entries().filter(([id, o]) => o.type === 'tv').map(([id, o]) => o.id);

			for (const tvId of tvIds) {
				const tvMesh = this.objectMeshs.get(tvId);
				const screenMesh = tvMesh?.getChildMeshes().find(m => m.name.includes('__TV_SCREEN__'))! as BABYLON.Mesh;
				screenMesh.material = tvScreenMaterial;

				const aspect = 16 / 9;

				const x = index % tvProgram.textureColumns;
				const y = Math.floor(index / tvProgram.textureColumns);

				const ax = x / tvProgram.textureColumns;
				const ay = y / tvProgram.textureRows / aspect;
				const bx = (x + 1) / tvProgram.textureColumns;
				const by = ay;
				const cx = ax;
				const cy = (y + 1) / tvProgram.textureRows / aspect;
				const dx = bx;
				const dy = cy;

				const uvs = screenMesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
				uvs[0] = dx;
				uvs[1] = dy;
				uvs[2] = bx;
				uvs[3] = by;
				uvs[4] = cx;
				uvs[5] = cy;
				uvs[6] = ax;
				uvs[7] = ay;
				screenMesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
			}

			const timeoutId = window.setTimeout(() => {
				this.timeoutIds = this.timeoutIds.filter(id => id !== timeoutId);
				applyTvTexture((tlIndex + 1) % tvProgram.timeline.length);
			}, duration);
			this.timeoutIds.push(timeoutId);
		};

		applyTvTexture(0);

		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
	}

	public selectObject(objectId: string | null) {
		if (this.selectedObjectId.value != null) {
			const prevMesh = this.objectMeshs.get(this.selectedObjectId.value);
			if (prevMesh != null) {
				for (const om of prevMesh.getChildMeshes()) {
					om.renderOutline = false;
				}
			}
			this.selectedObjectId.value = null;
		}

		if (objectId != null) {
			const mesh = this.objectMeshs.get(objectId);
			if (mesh != null) {
				for (const om of mesh.getChildMeshes()) {
					om.renderOutline = true;
				}
				this.selectedObjectId.value = objectId;
			}
		}
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

		if (this.enableGridSnapping.value) {
			newPos.x = Math.round(newPos.x / this.gridSnappingScale.value) * this.gridSnappingScale.value;
			newPos.y = Math.round(newPos.y / this.gridSnappingScale.value) * this.gridSnappingScale.value;
			newPos.z = Math.round(newPos.z / this.gridSnappingScale.value) * this.gridSnappingScale.value;
			newRotation.y = Math.round(newRotation.y / (Math.PI / 8)) * (Math.PI / 8);
		}

		let sticky: string | null = null;

		const isCollisionTarget = (m: BABYLON.AbstractMesh) => {
			return m.metadata?.objectId !== grabbing.objectId &&
				!m.metadata?.isGhost &&
				!grabbing.descendantStickyObjectIds.includes(m.metadata?.objectId);
		};

		if (placement === 'side') {
			// 前方に向かってレイを飛ばす
			const ray = new BABYLON.Ray(this.camera.position, dir, 1000/*cm*/);
			const hit = this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_WALL__') || m.name.includes('__SIDE__')));
			if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
				newPos.x = hit.pickedPoint.x;
				newPos.y = hit.pickedPoint.y;
				newPos.z = hit.pickedPoint.z;
				const pickedMeshNormal = hit.getNormal(true, true);
				const targetRotationY = Math.atan2(pickedMeshNormal.x, pickedMeshNormal.z);
				newRotation.y = targetRotationY;
				sticky = hit.pickedMesh.metadata?.objectId ?? null;
			}
		} else if (placement === 'wall') {
			// 前方に向かってレイを飛ばす
			const ray = new BABYLON.Ray(this.camera.position, dir, 1000/*cm*/);
			const hit = this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_WALL__')));
			if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
				newPos.x = hit.pickedPoint.x;
				newPos.y = hit.pickedPoint.y;
				newPos.z = hit.pickedPoint.z;
				const pickedMeshNormal = hit.getNormal(true, true);
				const targetRotationY = Math.atan2(pickedMeshNormal.x, pickedMeshNormal.z);
				newRotation.y = targetRotationY;
			}
		} else if (placement === 'bottom') {
			// 上に向かってレイを飛ばす
			const ray = new BABYLON.Ray(newPos, new BABYLON.Vector3(0, 1, 0), 1000/*cm*/);
			const hit = this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_CEILING__') || m.name.includes('__BOTTOM__')));
			if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
				newPos.y = hit.pickedPoint.y;
				sticky = hit.pickedMesh.metadata?.objectId ?? null;
			}
			if (newPos.y > 250/*cm*/) newPos.y = 250/*cm*/;
		} else if (placement === 'ceiling') {
			newPos.y = 250/*cm*/;

			if (this.enableGridSnapping.value) {
				this.yGridPreviewPlane.position = new BABYLON.Vector3(grabbing.mesh.position.x, 250/*cm*/ - 0.1/*cm*/, grabbing.mesh.position.z);
				this.yGridPreviewPlane.isVisible = true;
			}
		} else if (placement === 'floor') {
			newPos.y = 0;

			if (this.enableGridSnapping.value) {
				this.yGridPreviewPlane.position = new BABYLON.Vector3(grabbing.mesh.position.x, 0.1/*cm*/, grabbing.mesh.position.z);
				this.yGridPreviewPlane.isVisible = true;
			}
		} else {
			// 下に向かってレイを飛ばす
			const ray = new BABYLON.Ray(newPos, new BABYLON.Vector3(0, -1, 0), 1000/*cm*/);
			const hit = this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.includes('__ROOM_FLOOR__') || m.name.includes('__ROOM_TOP__') || m.name.includes('__TOP__')));
			if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
				newPos.y = hit.pickedPoint.y;
				sticky = hit.pickedMesh.metadata?.objectId ?? null;
			}
			if (newPos.y < 0) newPos.y = 0;

			if (this.enableGridSnapping.value) {
				this.yGridPreviewPlane.position = new BABYLON.Vector3(grabbing.mesh.position.x, grabbing.mesh.position.y + 0.1/*cm*/, grabbing.mesh.position.z);
				this.yGridPreviewPlane.isVisible = true;
			}
		}

		grabbing.mesh.rotation = newRotation;
		grabbing.mesh.position = newPos;

		//const pos = new BABYLON.Vector3(this.camera.position.x, this.camera.position.y, this.camera.position.z);
		//const _dir = newPos.subtract(pos).normalize();
		//for (let i = 0; i < grabbing.distance; i++) {
		//	// posを1cmずつnewPosの方向に動かす
		//	pos.addInPlace(_dir.scale(1/*cm*/));
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

		//const ray = new BABYLON.Ray(this.camera.position, this.camera.getDirection(BABYLON.Axis.Z), 1000/*cm*/);
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

		if (grabbing.isMainLight) {
			this.roomLight.position = grabbing.mesh.position.add(new BABYLON.Vector3(0, -1/*cm*/, 0));
		}

		grabbing.onMove?.({
			position: newPos,
			rotation: newRotation,
			sticky,
		});
	}

	private async loadEnvModel() {
		const envObj = await BABYLON.ImportMeshAsync('/client-assets/room/env.glb', this.scene);
		envObj.meshes[0].scaling = envObj.meshes[0].scaling.scale(WORLD_SCALE);
		envObj.meshes[0].bakeCurrentTransformIntoVertices();
		envObj.meshes[0].position = new BABYLON.Vector3(0, -900/*cm*/, 0); // 4階くらいの想定
		envObj.meshes[0].rotation = new BABYLON.Vector3(0, -Math.PI, 0);
		for (const mesh of envObj.meshes) {
			mesh.isPickable = false;
			mesh.checkCollisions = false;

			//if (mesh.name === '__root__') continue;
			mesh.receiveShadows = false;
			if (mesh.material) (mesh.material as BABYLON.PBRMaterial).reflectionTexture = this.envMapOutdoor;
		}
	}

	private async loadRoomModel() {
		//await BABYLON.InitializeCSG2Async();

		//const box = BABYLON.MeshBuilder.CreateBox('box', { size: 50/*cm*/ }, this.scene);
		//const boxCsg = BABYLON.CSG2.FromMesh(box);

		const demado = true;

		const meshes: BABYLON.Mesh[] = [];

		const floorResult = await BABYLON.ImportMeshAsync('/client-assets/room/rooms/default/300-floor.glb', this.scene);
		floorResult.meshes[0].scaling = floorResult.meshes[0].scaling.scale(WORLD_SCALE);
		const floorRoot = new BABYLON.Mesh('floor', this.scene);
		floorRoot.addChild(floorResult.meshes[0]);
		meshes.push(floorRoot);

		const ceilingResult = await BABYLON.ImportMeshAsync('/client-assets/room/rooms/default/300-ceiling.glb', this.scene);
		ceilingResult.meshes[0].scaling = ceilingResult.meshes[0].scaling.scale(WORLD_SCALE);
		const ceilingRoot = new BABYLON.Mesh('ceiling', this.scene);
		ceilingRoot.addChild(ceilingResult.meshes[0]);
		ceilingRoot.position = new BABYLON.Vector3(0, 250/*cm*/, 0);
		meshes.push(ceilingRoot);

		const wallAResult = await BABYLON.ImportMeshAsync('/client-assets/room/rooms/default/300-wall.glb', this.scene);
		wallAResult.meshes[0].scaling = wallAResult.meshes[0].scaling.scale(WORLD_SCALE);
		const wallARoot = new BABYLON.Mesh('wallA', this.scene);
		wallARoot.addChild(wallAResult.meshes[0]);
		wallARoot.position = new BABYLON.Vector3(-150/*cm*/, 0, 0);
		wallARoot.rotation = new BABYLON.Vector3(0, Math.PI, 0);
		meshes.push(wallARoot);

		const wallBResult = await BABYLON.ImportMeshAsync('/client-assets/room/rooms/default/300-wall.glb', this.scene);
		wallBResult.meshes[0].scaling = wallBResult.meshes[0].scaling.scale(WORLD_SCALE);
		const wallBRoot = new BABYLON.Mesh('wallB', this.scene);
		wallBRoot.addChild(wallBResult.meshes[0]);
		wallBRoot.position = new BABYLON.Vector3(150/*cm*/, 0, 0);
		meshes.push(wallBRoot);

		const wallCResult = await BABYLON.ImportMeshAsync('/client-assets/room/rooms/default/300-wall.glb', this.scene);
		wallCResult.meshes[0].scaling = wallCResult.meshes[0].scaling.scale(WORLD_SCALE);
		const wallCRoot = new BABYLON.Mesh('wallC', this.scene);
		wallCRoot.addChild(wallCResult.meshes[0]);
		wallCRoot.position = new BABYLON.Vector3(0, 0, -150/*cm*/);
		wallCRoot.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
		meshes.push(wallCRoot);

		const wallDResult = await BABYLON.ImportMeshAsync('/client-assets/room/rooms/default/300-wall-demado.glb', this.scene);
		wallDResult.meshes[0].scaling = wallDResult.meshes[0].scaling.scale(WORLD_SCALE);
		const wallDRoot = new BABYLON.Mesh('wallD', this.scene);
		wallDRoot.addChild(wallDResult.meshes[0]);
		wallDRoot.position = new BABYLON.Vector3(0, 0, 150/*cm*/);
		wallDRoot.rotation = new BABYLON.Vector3(0, -Math.PI / 2, 0);
		meshes.push(wallDRoot);

		for (const mesh of meshes) {
			for (const m of mesh.getChildMeshes()) {
				if (m.name.includes('__ROOM_WALL__') || m.name.includes('__ROOM_SIDE__') || m.name.includes('__ROOM_FLOOR__') || m.name.includes('__ROOM_CEILING__') || m.name.includes('__ROOM_TOP__')) {
					m.isPickable = false;
					m.receiveShadows = false;
					m.isVisible = false;
					m.checkCollisions = true;
					this.roomCollisionMeshes.push(m);
					continue;
				}

				m.isPickable = false;
				m.checkCollisions = false;
				m.receiveShadows = true;
				this.shadowGenerator1.addShadowCaster(m);
				this.shadowGenerator2.addShadowCaster(m);
				//if (m.material) (m.material as BABYLON.PBRMaterial).ambientColor = new BABYLON.Color3(1, 1, 1);
				if (m.material) {
					(m.material as BABYLON.PBRMaterial).reflectionTexture = this.enableReflectionProbe ? this.reflectionProbe.cubeTexture : this.envMapIndoor;
				}
				if (this.enableReflectionProbe) this.reflectionProbe.renderList!.push(m);
			}
		}
	}

	private async loadObject(args: {
		type: string;
		id: string;
		position: BABYLON.Vector3;
		rotation: BABYLON.Vector3;
		options: any;
		isMainLight?: boolean;
	}) {
		const def = getObjectDef(args.type);

		const camelToKebab = (str: string) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

		const root = new BABYLON.Mesh(`object_${args.id}_${args.type}`, this.scene);

		const loaderResult = await BABYLON.ImportMeshAsync(`/client-assets/room/objects/${camelToKebab(args.type)}/${camelToKebab(args.type)}.glb`, this.scene);

		let hasCollisionMesh = false;
		for (const mesh of loaderResult.meshes) {
			if (mesh.name.includes('__COLLISION__')) {
				hasCollisionMesh = true;
				break;
			}
		}

		const metadata = {
			isObject: true,
			objectId: args.id,
			objectType: args.type,
			isCollision: !hasCollisionMesh,
		};

		// babylonによって自動で追加される右手系変換用ノード
		const subRoot = loaderResult.meshes[0];
		subRoot.scaling = subRoot.scaling.scale(WORLD_SCALE);// cmをmに

		root.addChild(subRoot);

		root.position = args.position.clone();
		root.rotation = args.rotation.clone();
		root.metadata = metadata;

		const meshUpdated = (meshes: BABYLON.Mesh[]) => {
			for (const m of meshes) {
				const mesh = m;

				mesh.metadata = metadata;
				mesh.checkCollisions = !hasCollisionMesh;

				if (mesh.name.includes('__TV_SCREEN__')) {
					mesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.UVKind, true);
				}

				if (mesh.name.includes('__COLLISION__')) {
					mesh.receiveShadows = false;
					mesh.isVisible = false;
					mesh.metadata.isCollision = true;
					mesh.checkCollisions = true;
				} else if (mesh.name.includes('__TOP__') || mesh.name.includes('__SIDE__')) {
					mesh.receiveShadows = false;
					mesh.isVisible = false;
				} else {
					if (!args.isMainLight && def.receiveShadows !== false) mesh.receiveShadows = true;
					if (!args.isMainLight && def.castShadows !== false) {
						this.shadowGenerator1.addShadowCaster(mesh);
						this.shadowGenerator2.addShadowCaster(mesh);
					}

					mesh.renderOutline = this.selectedObjectId.value === args.id;
					mesh.outlineWidth = 0.003;
					mesh.outlineColor = new BABYLON.Color3(1, 0, 0);
					//if (mesh.material) (mesh.material as BABYLON.PBRMaterial).ambientColor = new BABYLON.Color3(0.2, 0.2, 0.2);
					if (mesh.material) {
						(mesh.material as BABYLON.PBRMaterial).reflectionTexture = this.enableReflectionProbe ? this.reflectionProbe.cubeTexture : this.envMapIndoor;
					}
				}
			}
		};

		meshUpdated(loaderResult.meshes);

		this.objectMeshs.set(args.id, root);

		const objectInstance = def.createInstance({
			room: this,
			root,
			options: args.options, // todo: merge with default options
			loaderResult: loaderResult,
			meshUpdated: () => {
				meshUpdated(this.objectMeshs.get(args.id)!.getChildMeshes() as BABYLON.Mesh[]);
			},
		});

		this.objectInstances.set(args.id, objectInstance);

		if (objectInstance.onInited != null) {
			objectInstance.onInited();
		}

		if (args.isMainLight) {
			this.roomLight.position = root.position.add(new BABYLON.Vector3(0, -1/*cm*/, 0));
		}

		return { root, objectInstance };
	}

	public beginSelectedInstalledObjectGrabbing() {
		if (this.selectedObjectId.value == null) return;

		const selectedObject = this.objectMeshs.get(this.selectedObjectId.value)!;
		for (const om of selectedObject.getChildMeshes()) {
			om.renderOutline = false;
		}

		const placement = getObjectDef(selectedObject.metadata.objectType).placement;

		if (placement === 'top') {
			// stickyな場合にsticky先とのレイの距離が0になりstickyされていない初期状態でgrabbingが始まってしまうのでちょっと浮かす
			selectedObject.position.y += 1/*cm*/;
		}

		const distance = BABYLON.Vector3.Distance(this.camera.position, selectedObject.position);
		const ghost = this.createGhost(selectedObject);

		// 子から先に適用していく
		const setStickyParentRecursively = (mesh: BABYLON.AbstractMesh) => {
			const stickyObjectIds = Array.from(this.roomState.installedObjects.filter(o => o.sticky === mesh.metadata.objectId)).map(o => o.id);
			for (const soid of stickyObjectIds) {
				const soMesh = this.objectMeshs.get(soid)!;
				setStickyParentRecursively(soMesh);
				soMesh.setParent(mesh);
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

		const dir = this.camera.getDirection(BABYLON.Axis.Z).scale(this.scene.useRightHandedSystem ? -1 : 1);

		const initialPosition = selectedObject.position.clone();
		const initialRotation = selectedObject.rotation.clone();

		let sticky: string | null;

		this.ui.isGrabbing = true;

		this.grabbingCtx = {
			objectId: selectedObject.metadata.objectId,
			objectType: selectedObject.metadata.objectType,
			mesh: selectedObject,
			originalDiffOfPosition: selectedObject.position.subtract(this.camera.position.add(dir.scale(distance))),
			originalDiffOfRotationY: selectedObject.rotation.subtract(this.camera.rotation).y,
			distance: distance,
			rotation: 0,
			ghost: ghost,
			descendantStickyObjectIds,
			isMainLight: this.roomState.installedObjects.find(o => o.id === selectedObject.metadata.objectId)?.isMainLight ?? false,
			onMove: (info) => {
				sticky = info.sticky;
			},
			onCancel: () => {
				this.ui.isGrabbing = false;

				// todo: initialPositionなどを復元
			},
			onDone: () => { // todo: sticky状態などを引数でもらうようにしたい
				this.ui.isGrabbing = false;

				// 親から先に外していく
				const removeStickyParentRecursively = (mesh: BABYLON.Mesh) => {
					const stickyObjectIds = Array.from(this.roomState.installedObjects.filter(o => o.sticky === mesh.metadata.objectId)).map(o => o.id);
					for (const soid of stickyObjectIds) {
						const soMesh = this.objectMeshs.get(soid)!;
						soMesh.setParent(null);
						removeStickyParentRecursively(soMesh);
					}
				};
				removeStickyParentRecursively(this.grabbingCtx.mesh);
				const pos = this.grabbingCtx.mesh.position.clone();
				const rotation = this.grabbingCtx.mesh.rotation.clone();
				this.selectObject(null);

				this.roomState.installedObjects.find(o => o.id === selectedObject.metadata.objectId)!.sticky = sticky;
				this.roomState.installedObjects.find(o => o.id === selectedObject.metadata.objectId)!.position = [pos.x, pos.y, pos.z];
				this.roomState.installedObjects.find(o => o.id === selectedObject.metadata.objectId)!.rotation = [rotation.x, rotation.y, rotation.z];

				this.putParticleSystem.emitter = pos;
				this.putParticleSystem.start();

				sound.playUrl('/client-assets/room/sfx/put.mp3', {
					volume: 1,
					playbackRate: 1,
				});
			},
		};

		const intervalId = window.setInterval(() => {
			this.handleGrabbing();
		}, 10);

		this.intervalIds.push(intervalId);

		sound.playUrl('/client-assets/room/sfx/grab.mp3', {
			volume: 1,
			playbackRate: 1,
		});
	}

	public endGrabbing() {
		if (this.grabbingCtx == null) return;

		//this.grabbing.ghost.dispose(false, true);
		this.grabbingCtx.ghost.dispose(false, false);
		this.grabbingCtx.onDone?.();
		this.grabbingCtx = null;
		this.selectObject(null);

		this.xGridPreviewPlane.isVisible = false;
		this.yGridPreviewPlane.isVisible = false;
		this.zGridPreviewPlane.isVisible = false;
	}

	public interact(oid: string) {
		const o = this.roomState.installedObjects.find(o => o.id === oid)!;
		const mesh = this.objectMeshs.get(o.id)!;
		const objDef = getObjectDef(o.type);
		const obji = this.objectInstances.get(o.id)!;

		if (objDef.isChair) {
			this.sitChair(o.id);
		} else {
			if (obji.primaryInteraction != null) {
				obji.interactions[obji.primaryInteraction].fn();
			}
		}
	}

	public sitChair(objectId: string) {
		this.isSitting.value = true;
		this.fixedCamera.parent = this.objectMeshs.get(objectId);
		this.fixedCamera.position = new BABYLON.Vector3(0, 120/*cm*/, 0);
		this.fixedCamera.rotation = new BABYLON.Vector3(0, 0, 0);
		this.scene.activeCamera = this.fixedCamera;
		this.selectObject(null);
	}

	public standUp() {
		this.isSitting.value = false;
		this.scene.activeCamera = this.camera;
		this.fixedCamera.parent = null;
	}

	private turnOnRoomLight() {
		this.roomLight.intensity = 300000;
		this.envMapIndoor.level = 0.3;
	}

	private turnOffRoomLight() {
		this.roomLight.intensity = 0;
		this.envMapIndoor.level = 0;
	}

	public toggleRoomLight() {
		if (this.roomLight.intensity > 0) {
			this.turnOffRoomLight();
		} else {
			this.turnOnRoomLight();
		}
	}

	private createGhost(mesh: BABYLON.Mesh) {
		const ghost = mesh.clone('ghost', null, false)!;
		ghost.metadata = { isGhost: true };
		for (const m of ghost.getChildMeshes()) {
			m.metadata = { isGhost: true };
			if (m.material) {
				const mat = m.material.clone(`${m.material.name}_ghost`);
				mat.alpha = 0.3;
				mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
				m.material = mat;
			}
			m.checkCollisions = false;
		}
		return ghost;
	}

	public async addObject(type: string) {
		if (this.grabbingCtx != null) return;

		this.isEditMode.value = true;

		const dir = this.camera.getDirection(BABYLON.Axis.Z).scale(this.scene.useRightHandedSystem ? -1 : 1);
		const distance = 30/*cm*/;

		const id = genId();

		const def = getObjectDef(type);

		const { root } = await this.loadObject({
			id: id,
			type,
			position: new BABYLON.Vector3(0, 0, 0),
			rotation: new BABYLON.Vector3(0, Math.PI, 0),
			options: def.defaultOptions,
		});

		const ghost = this.createGhost(root);

		let sticky: string | null;

		this.ui.isGrabbingForInstall = true;

		this.grabbingCtx = {
			objectId: id,
			objectType: type,
			mesh: root,
			originalDiffOfPosition: new BABYLON.Vector3(0, 0, 0),
			originalDiffOfRotationY: Math.PI,
			distance: distance,
			rotation: 0,
			ghost: ghost,
			descendantStickyObjectIds: [],
			isMainLight: false,
			onMove: (info) => {
				sticky = info.sticky;
			},
			onCancel: () => {
				this.ui.isGrabbingForInstall = false;

				// todo
			},
			onDone: () => { // todo: sticky状態などを引数でもらうようにしたい
				this.ui.isGrabbingForInstall = false;

				const pos = this.grabbingCtx.mesh.position.clone();
				const rotation = this.grabbingCtx.mesh.rotation.clone();

				this.putParticleSystem.emitter = pos;
				this.putParticleSystem.start();

				sound.playUrl('/client-assets/room/sfx/put.mp3', {
					volume: 1,
					playbackRate: 1,
				});

				this.roomState.installedObjects.push({
					id,
					type,
					position: [pos.x, pos.y, pos.z],
					rotation: [rotation.x, rotation.y, rotation.z],
					sticky,
					options: def.defaultOptions,
				});
			},
		};

		const intervalId = window.setInterval(() => {
			this.handleGrabbing();
		}, 10);

		this.intervalIds.push(intervalId);

		sound.playUrl('/client-assets/room/sfx/grab.mp3', {
			volume: 1,
			playbackRate: 1,
		});
	}

	public changeGrabbingDistance(delta: number) {
		if (this.grabbingCtx == null) return;
		this.grabbingCtx.distance -= delta;
		if (this.grabbingCtx.distance < 5/*cm*/) this.grabbingCtx.distance = 5/*cm*/;
	}

	public changeGrabbingRotationY(delta: number) {
		if (this.grabbingCtx == null) return;
		this.grabbingCtx.rotation += delta;
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
	}
}

const TV_PROGRAMS = {
	shopping: {
		textureColumns: 8,
		textureRows: 8,
		timeline: [
			[0, 500],
			[1, 500],
			[0, 500],
			[1, 500],
			[0, 500],
			[1, 500],
			[2, 500],
			[3, 500],
			[2, 500],
			[3, 500],
			[4, 500],
			[5, 500],
			[4, 500],
			[5, 500],
			[6, 500],
			[7, 500],
			[8, 500],
			[9, 500],
			[8, 500],
			[9, 500],
			[2, 500],
			[3, 500],
			[2, 500],
			[3, 500],
		],
	},
} satisfies Record<string, {
	textureColumns: number;
	textureRows: number;
	timeline: [index: number, duration: number][];
}>;
