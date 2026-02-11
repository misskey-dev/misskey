/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * Roomで使われるオブジェクトの仕様
 * - 単位はセンチメートルで設計すること。
 * - それを置いたときに底になる縦軸座標(blenderならz)が0になるように設計すること。
 * - 壁面設置の場合は壁面に接する面のX軸座標が0になるように設計すること。
 * - メッシュ名を _COLLISION_TOP_ で始めると、その面の上にモノを置けることを示す。当該メッシュはレンダリングでは表示されません。
 * - メッシュ名を _COLLISION_SIDE_ で始めると、その面にモノを貼り付けられることを示す。当該メッシュはレンダリングでは表示されません。
 * - なお、現状 _COLLISION_TOP_ / _COLLISION_SIDE_ メッシュは単一の面でなければなりません。つまりArray Modifierなどを適用した状態では正しく動作しません。
 */

import * as BABYLON from '@babylonjs/core';
import { AxesViewer } from '@babylonjs/core/Debug/axesViewer';
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic';
import * as sound from '@/utility/sound.js';

type RoomDef = {
	roomType: 'default';
	objects: {
		id: string;
		type: string;
		position: [number, number, number];
		rotation: [number, number, number];
		variation?: string | null;

		/**
		 * 別のオブジェクトのID
		 */
		sticky?: string | null;
	}[];
};

type ObjectDef = {
	placement: 'top' | 'side';
	onInit?: (room: RoomEngine, o: RoomDef['objects'][0], obj: BABYLON.ISceneLoaderAsyncResult) => void;
};

function yuge(room: RoomEngine, obj: BABYLON.ISceneLoaderAsyncResult, offset: BABYLON.Vector3) {
	const emitter = new BABYLON.TransformNode('emitter', room.scene);
	emitter.parent = obj.meshes[0];
	emitter.position = offset;
	const ps = new BABYLON.ParticleSystem('steamParticleSystem', 8, room.scene);
	ps.particleTexture = new BABYLON.Texture('/client-assets/room/steam.png');
	ps.emitter = emitter;
	ps.minEmitBox = new BABYLON.Vector3(-1/*cm*/, 0, -1/*cm*/);
	ps.maxEmitBox = new BABYLON.Vector3(1/*cm*/, 0, 1/*cm*/);
	ps.minEmitPower = 10;
	ps.maxEmitPower = 12;
	ps.minLifeTime = 2;
	ps.maxLifeTime = 3;
	ps.addSizeGradient(0, 10/*cm*/, 12/*cm*/);
	ps.addSizeGradient(1, 18/*cm*/, 20/*cm*/);
	ps.direction1 = new BABYLON.Vector3(-0.3, 1, 0.3);
	ps.direction2 = new BABYLON.Vector3(0.3, 1, -0.3);
	ps.emitRate = 0.5;
	ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
	ps.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
	ps.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
	ps.colorDead = new BABYLON.Color4(1, 1, 1, 0);
	ps.preWarmCycles = Math.random() * 1000;
	ps.start();
}

const OBJECTS = {
	plant: {
		placement: 'top',
	},
	mug: {
		placement: 'top',
		onInit: (room, o, obj) => {
			yuge(room, obj, new BABYLON.Vector3(0, 5/*cm*/, 0));
		},
	},
	'cup-noodle': {
		placement: 'top',
		onInit: (room, o, obj) => {
			yuge(room, obj, new BABYLON.Vector3(0, 10/*cm*/, 0));
		},
	},
	stickyNote: {
		placement: 'side',
	},
	'cardboard-box': {
		placement: 'top',
		onInit: (room, o, obj) => {
			const boxMesh = obj.meshes[0].getChildMeshes().find(m => m.name === 'Box') as BABYLON.Mesh;
			if (o.variation === 'mikan') {
				const tex = new BABYLON.Texture('/client-assets/room/objects/cardboard-box/mikan.png', room.scene, false, false);
				(boxMesh.material as BABYLON.PBRMaterial).albedoTexture = tex;
				(boxMesh.material as BABYLON.PBRMaterial).albedoColor = new BABYLON.Color3(1, 1, 1);
			} else if (o.variation === 'aizon') {
				const tex = new BABYLON.Texture('/client-assets/room/objects/cardboard-box/aizon.png', room.scene, false, false);
				(boxMesh.material as BABYLON.PBRMaterial).albedoTexture = tex;
				(boxMesh.material as BABYLON.PBRMaterial).albedoColor = new BABYLON.Color3(1, 1, 1);
			}
		},
	},
	'lava-lamp': {
		placement: 'top',
		onInit: (room, o, obj) => {
			const light = new BABYLON.PointLight('lavaLampLight', new BABYLON.Vector3(0, 11/*cm*/, 0), room.scene);
			light.parent = obj.meshes[0];
			light.diffuse = new BABYLON.Color3(1.0, 0.5, 0.2);
			light.intensity = 300;
			light.range = 100/*cm*/;

			const sphere = BABYLON.MeshBuilder.CreateSphere('lavaLampLightSphere', { diameter: 4/*cm*/ }, room.scene);
			sphere.parent = obj.meshes[0];
			sphere.position = new BABYLON.Vector3(0, 15/*cm*/, 0);
			const mat = new BABYLON.StandardMaterial('lavaLampLightMat', room.scene);
			mat.emissiveColor = new BABYLON.Color3(1.0, 0.5, 0.2);

			mat.alpha = 0.5;
			//mat.disableLighting = true;
			sphere.material = mat;

			const anim = new BABYLON.Animation('lavaLampLightAnim', 'position.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
			anim.setKeys([
				{ frame: 0, value: 11/*cm*/ },
				{ frame: 500, value: 38/*cm*/ },
			]);
			sphere.animations = [anim];
			room.scene.beginAnimation(sphere, 0, 500, true);

			const emitter = new BABYLON.TransformNode('emitter', room.scene);
			emitter.parent = obj.meshes[0];
			emitter.position = new BABYLON.Vector3(0, 10/*cm*/, 0);
			const ps = new BABYLON.ParticleSystem('', 32, room.scene);
			ps.particleTexture = new BABYLON.Texture('/client-assets/room/objects/lava-lamp/bubble.png');
			ps.emitter = emitter;
			ps.isLocal = true;
			ps.minEmitBox = new BABYLON.Vector3(-1/*cm*/, 0, -1/*cm*/);
			ps.maxEmitBox = new BABYLON.Vector3(1/*cm*/, 0, 1/*cm*/);
			ps.minEmitPower = 2;
			ps.maxEmitPower = 3;
			ps.minLifeTime = 9;
			ps.maxLifeTime = 9;
			ps.minSize = 0.5/*cm*/;
			ps.maxSize = 1/*cm*/;
			ps.direction1 = new BABYLON.Vector3(0, 1, 0);
			ps.direction2 = new BABYLON.Vector3(0, 1, 0);
			ps.emitRate = 1;
			ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
			ps.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
			ps.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
			ps.colorDead = new BABYLON.Color4(1, 1, 1, 0);
			ps.preWarmCycles = Math.random() * 1000;
			ps.start();
		},
	},
	'wall-clock': {
		placement: 'side',
		onInit: (room, o, obj) => {
			const hourHand = obj.meshes[0].getChildMeshes().find(m => m.name === 'HandH') as BABYLON.Mesh;
			const minuteHand = obj.meshes[0].getChildMeshes().find(m => m.name === 'HandM') as BABYLON.Mesh;
			room.intervalIds.push(window.setInterval(() => {
				const now = new Date();
				const hours = now.getHours() % 12;
				const minutes = now.getMinutes();
				const hAngle = -(hours / 12) * Math.PI * 2 - (minutes / 60) * (Math.PI * 2 / 12);
				const mAngle = -(minutes / 60) * Math.PI * 2;
				hourHand.rotation = new BABYLON.Vector3(hAngle, 0, 0);
				minuteHand.rotation = new BABYLON.Vector3(mAngle, 0, 0);
			}, 1000));
		},
	},
	aircon: {
		placement: 'side',
	},
} as Record<string, ObjectDef>;

function vecToLocal(vector: BABYLON.Vector3, mesh: BABYLON.Mesh): BABYLON.Vector3 {
	const m = mesh.getWorldMatrix();
	const v = BABYLON.Vector3.TransformCoordinates(vector, m);
	return v;
}

const _assumedFramesPerSecond = 60;

class HorizontalCameraKeyboardMoveInput extends BABYLON.BaseCameraPointersInput {
	public camera: BABYLON.FreeCamera;
	private engine: BABYLON.AbstractEngine;
	private scene: BABYLON.Scene;
	moveSpeed = 6 / _assumedFramesPerSecond;
	preShift = false;
	codes = [];
	codesUp = ['KeyW'];
	codesDown = ['KeyS'];
	codesLeft = ['KeyA'];
	codesRight = ['KeyD'];
	onCanvasBlurObserver = null;
	onKeyboardObserver = null;

	constructor(camera: BABYLON.UniversalCamera) {
		super();
		this.camera = camera;
		this.scene = this.camera.getScene();
		this.engine = this.scene.getEngine();
	}

	attachControl() {
		if (this.onCanvasBlurObserver) {
			return;
		}

		this.onCanvasBlurObserver = this.engine.onCanvasBlurObservable.add(() => {
			this.codes = [];
		});

		this.onKeyboardObserver = this.scene.onKeyboardObservable.add(({ event, type }) => {
			const { code, shiftKey } = event;
			this.preShift = shiftKey;

			if (type === BABYLON.KeyboardEventTypes.KEYDOWN) {
				if (this.codesUp.indexOf(code) >= 0 ||
          this.codesDown.indexOf(code) >= 0 ||
          this.codesLeft.indexOf(code) >= 0 ||
          this.codesRight.indexOf(code) >= 0) {
					const index = this.codes.findIndex(v => v.code === code);
					if (index < 0) { // 存在しなかったら追加する
						this.codes.push({ code });
					}
					event.preventDefault();
					(event as KeyboardEvent).stopPropagation();
				}
			} else {
				if (this.codesUp.indexOf(code) >= 0 ||
          this.codesDown.indexOf(code) >= 0 ||
          this.codesLeft.indexOf(code) >= 0 ||
          this.codesRight.indexOf(code) >= 0) {
					const index = this.codes.findIndex(v => v.code === code);
					if (index >= 0) { // 存在したら削除する
						this.codes.splice(index, 1);
					}
					event.preventDefault();
					(event as KeyboardEvent).stopPropagation();
				}
			}
		});
	}

	detachControl() {
		this.codes = [];

		if (this.onKeyboardObserver) this.scene.onKeyboardObservable.remove(this.onKeyboardObserver);
		if (this.onCanvasBlurObserver) this.engine.onCanvasBlurObservable.remove(this.onCanvasBlurObserver);
		this.onKeyboardObserver = null;
		this.onCanvasBlurObserver = null;
	}

	checkInputs() {
		if (!this.onKeyboardObserver) {
			return;
		}
		for (let index = 0; index < this.codes.length; index++) {
			const { code } = this.codes[index];

			const local = new BABYLON.Vector3();
			if (this.codesLeft.indexOf(code) >= 0) {
				local.x += -1;
			} else if (this.codesUp.indexOf(code) >= 0) {
				local.z += 1;
			} else if (this.codesRight.indexOf(code) >= 0) {
				local.x += 1;
			} else if (this.codesDown.indexOf(code) >= 0) {
				local.z += -1;
			}

			if (local.length() === 0) {
				continue;
			}

			const dir = this.camera.getDirection(local.normalize());
			dir.y = 0;
			dir.normalize();
			const rate = this.preShift ? 3 : 1;
			const move = dir.scale(this.moveSpeed * rate);
			this.camera.cameraDirection.addInPlace(move);
		}
	}

	getClassName() {
		return 'HorizontalCameraKeyboardMoveInput';
	}

	getSimpleName() {
		return 'horizontalkeyboard';
	}
}

export class RoomEngine {
	private canvas: HTMLCanvasElement;
	private engine: BABYLON.Engine;
	public scene: BABYLON.Scene;
	private shadowGenerator1: BABYLON.ShadowGenerator;
	private shadowGenerator2: BABYLON.ShadowGenerator;
	private camera: BABYLON.UniversalCamera;
	private camera2: BABYLON.ArcRotateCamera;
	private intervalIds: number[] = [];
	private timeoutIds: number[] = [];
	private objectMeshs: Map<string, BABYLON.AbstractMesh> = new Map();
	private grabbing: {
		objectId: string;
		mesh: BABYLON.AbstractMesh;
		startOffset: BABYLON.Vector3;
		startRotationY: number;
		startDistance: number;
		ghost: BABYLON.AbstractMesh;
		descendantStickyObjectIds: string[];
	} | null = null;
	private highlightedObjectId: string | null = null;
	private time: 0 | 1 | 2 = 2; // 0: 昼, 1: 夕, 2: 夜
	private roomCollisionMeshes: BABYLON.AbstractMesh[] = [];
	private def: RoomDef;
	public enableGridSnapping = false;
	private putParticleSystem: BABYLON.ParticleSystem;

	constructor(def: RoomDef, options: {
		canvas: HTMLCanvasElement;
	}) {
		this.def = def;
		this.canvas = options.canvas;

		registerBuiltInLoaders();

		this.engine = new BABYLON.Engine(options.canvas, false, { alpha: false });
		this.scene = new BABYLON.Scene(this.engine);
		//this.scene.autoClear = true;
		if (this.time === 0) {
			this.scene.clearColor = new BABYLON.Color4(0.4, 0.8, 1.0, 0);
		} else if (this.time === 1) {
			this.scene.clearColor = new BABYLON.Color4(0.5, 0.3, 0.3, 0);
		} else {
			this.scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.2, 0);
		}
		this.scene.collisionsEnabled = true;

		//new MmdOutlineRenderer(this.scene);

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

		this.camera2 = new BABYLON.ArcRotateCamera('camera2', -Math.PI / 2, Math.PI / 2.5, 300/*cm*/, new BABYLON.Vector3(0, 90/*cm*/, 0), this.scene);
		this.camera2.attachControl(this.canvas);
		this.camera2.minZ = 1/*cm*/;
		this.camera2.maxZ = 100000/*cm*/;
		this.camera2.fov = 0.5;

		this.scene.activeCamera = this.camera;

		const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, -0.5), this.scene);
		ambientLight.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
		ambientLight.intensity = 0.5;

		const roomLight = new BABYLON.SpotLight('roomLight', new BABYLON.Vector3(0, 249/*cm*/, 0), new BABYLON.Vector3(0, -1, 0), 16, 8, this.scene);
		roomLight.diffuse = new BABYLON.Color3(1.0, 0.9, 0.8);
		roomLight.intensity = 150000;
		roomLight.shadowMinZ = 10/*cm*/;
		roomLight.shadowMaxZ = 300/*cm*/;

		this.shadowGenerator1 = new BABYLON.ShadowGenerator(2048, roomLight);
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

		const gl = new BABYLON.GlowLayer('glow', this.scene, {
			//mainTextureFixedSize: 512,
			blurKernelSize: 64,
		});
		gl.intensity = 0.5;

		{
			const postProcess = new BABYLON.ImageProcessingPostProcess('processing', 1.0, this.camera);
			postProcess.exposure = 2;
			postProcess.contrast = 0.9;
			//const curve = new BABYLON.ColorCurves();
			//curve.highlightsHue = 40;
			//curve.highlightsDensity = 50;
			//curve.highlightsSaturation = 40;
			//curve.shadowsHue = 200;
			//curve.shadowsDensity = 100;
			//curve.shadowsSaturation = 40;
			//postProcess.colorCurvesEnabled = true;
			//postProcess.colorCurves = curve;

			//const postProcess2 = new BABYLON.ImageProcessingPostProcess('processing2', 1.0, this.camera2);
			//postProcess2.exposure = 2;
			//postProcess2.contrast = 0.9;

			const ssao = new BABYLON.SSAORenderingPipeline('ssao', this.scene, {
				ssaoRatio: 4,
				combineRatio: 1,
			});
			ssao.radius = 0.0001;
			ssao.totalStrength = 0.8;
			this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline('ssao', this.camera);

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

		this.canvas.addEventListener('click', (ev) => {
			if (this.grabbing != null) return;
			if (isDragging) return;
			const mesh = this.scene.pick(this.scene.pointerX, this.scene.pointerY)?.pickedMesh;
			if (mesh != null) {
				const oid = mesh.metadata.objectId;
				if (oid != null && this.objectMeshs.has(oid)) {
					const o = this.objectMeshs.get(oid)!;
					// focus camera
					this.camera.setTarget(o.position);
				}
			}
		});

		this.canvas.addEventListener('keypress', (ev) => {
			if (ev.code === 'KeyE') {
				ev.preventDefault();
				ev.stopPropagation();
				this.toggleGrab();
			}
		});

		if (_DEV_) {
			const axes = new AxesViewer(this.scene, 30);
			axes.xAxis.position = new BABYLON.Vector3(0, 30, 0);
			axes.yAxis.position = new BABYLON.Vector3(0, 30, 0);
			axes.zAxis.position = new BABYLON.Vector3(0, 30, 0);
		}
	}

	public async init() {
		await this.loadRoomModel(this.def.roomType);
		await this.loadEnvModel();
		await Promise.all(this.def.objects.map(o => this.loadObject(o)));

		//const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 1/*cm*/ }, this.scene);

		this.intervalIds.push(window.setInterval(() => {
			if (this.grabbing != null) {
				this.handleGrabbing();
			} else {
				this.handleSeeking();
			}
		}, 10));

		// update tv texure
		const tvProgramId = 'shopping';
		const tvProgram = TV_PROGRAMS[tvProgramId];
		const tvScreenMaterial = new BABYLON.StandardMaterial('tvScreenMaterial', this.scene);
		tvScreenMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
		tvScreenMaterial.ambientColor = new BABYLON.Color3(0, 0, 0);
		tvScreenMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
		tvScreenMaterial.emissiveTexture = new BABYLON.Texture(`/client-assets/room/tv/${tvProgramId}/${tvProgramId}.png`, this.scene, false, false);
		tvScreenMaterial.emissiveTexture.level = 0.5;
		tvScreenMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
		tvScreenMaterial.freeze();

		const applyTvTexture = (tlIndex: number) => {
			const [index, duration] = tvProgram.timeline[tlIndex];
			const tvIds = this.def.objects.entries().filter(([id, o]) => o.type === 'tv').map(([id, o]) => o.id);

			for (const tvId of tvIds) {
				const tvMesh = this.objectMeshs.get(tvId);
				const screenMesh = tvMesh?.getChildMeshes().find(m => m.name.startsWith('_TV_SCREEN_'))! as BABYLON.Mesh;
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

	private handleSeeking() {
		this.highlightedObjectId = null;
		const ray = new BABYLON.Ray(this.camera.position, this.camera.getDirection(BABYLON.Axis.Z), 1000/*cm*/);
		for (const [id, o] of this.objectMeshs.entries()) {
			for (const om of o.getChildMeshes()) {
				om.renderOutline = false;
			}
		}
		const hit = this.scene.pickWithRay(ray)!;
		if (hit.pickedMesh != null) {
			const oid = hit.pickedMesh.metadata?.objectId;
			if (oid != null && this.objectMeshs.has(oid)) {
				this.highlightedObjectId = oid;
				const o = this.objectMeshs.get(oid)!;
				for (const om of o.getChildMeshes()) {
					om.renderOutline = true;
				}
			}
		}
	}

	private handleGrabbing() {
		if (this.grabbing == null) return;
		const grabbing = this.grabbing;

		const dir = this.camera.getDirection(BABYLON.Axis.Z);
		grabbing.ghost.position = this.camera.position.add(dir.scale(grabbing.startDistance)).add(grabbing.startOffset);
		grabbing.ghost.rotation = new BABYLON.Vector3(0, this.camera.rotation.y + grabbing.startRotationY, 0);

		if (this.enableGridSnapping) {
			const scale = 10/*cm*/;
			grabbing.ghost.position.x = Math.round(grabbing.ghost.position.x / scale) * scale;
			grabbing.ghost.position.y = Math.round(grabbing.ghost.position.y / scale) * scale;
			grabbing.ghost.position.z = Math.round(grabbing.ghost.position.z / scale) * scale;
			grabbing.ghost.rotation.y = Math.round(grabbing.ghost.rotation.y / (Math.PI / 4)) * (Math.PI / 4);
		}

		const newPos = grabbing.ghost.position.clone();
		const newRotation = grabbing.ghost.rotation.clone();
		let sticky: string | null = null;

		const isCollisionTarget = (m: BABYLON.AbstractMesh) => {
			return m.metadata?.objectId !== grabbing.objectId &&
				!m.metadata?.isGhost &&
				!grabbing.descendantStickyObjectIds.includes(m.metadata?.objectId);
		};

		const placement = OBJECTS[this.def.objects.find(o => o.id === grabbing.objectId)!.type].placement;
		if (placement === 'side') {
			// 前方に向かってレイを飛ばす
			const ray = new BABYLON.Ray(this.camera.position, dir, 1000/*cm*/);
			const hit = this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.startsWith('_COLLISION_WALL_') || m.name.startsWith('_COLLISION_SIDE_')));
			if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
				newPos.x = hit.pickedPoint.x;
				newPos.y = hit.pickedPoint.y;
				newPos.z = hit.pickedPoint.z;
				const pickedMeshNormal = hit.getNormal(true, true);
				const normalLocal = vecToLocal(pickedMeshNormal, hit.pickedMesh);
				newRotation.y = Math.atan2(normalLocal.z, normalLocal.x);
				sticky = hit.pickedMesh.metadata?.objectId ?? null;
			}
		} else {
			// 下に向かってレイを飛ばす
			const ray = new BABYLON.Ray(grabbing.ghost.position, new BABYLON.Vector3(0, -1, 0), 1000/*cm*/);
			const hit = this.scene.pickWithRay(ray, (m) => isCollisionTarget(m) && (m.name.startsWith('_COLLISION_FLOOR_') || m.name.startsWith('_COLLISION_TOP_')));
			if (hit != null && hit.pickedPoint != null && hit.pickedMesh != null) {
				newPos.y = hit.pickedPoint.y;
				sticky = hit.pickedMesh.metadata?.objectId ?? null;
			}
		}

		if (sticky != null) {
			this.def.objects.find(o => o.id === grabbing.objectId)!.sticky = sticky;
		} else {
			this.def.objects.find(o => o.id === grabbing.objectId)!.sticky = null;
		}

		grabbing.mesh.position = newPos;
		grabbing.mesh.rotation = newRotation;

		//const ray = new BABYLON.Ray(this.camera.position, this.camera.getDirection(BABYLON.Axis.Z), 1000/*cm*/);
		//const hit = this.scene.pickWithRay(ray, (m) => m.name.startsWith('_COLLISION_WALL_'))!;
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
	}

	private async loadEnvModel() {
		const envObj = await BABYLON.ImportMeshAsync('/client-assets/room/env.glb', this.scene);
		envObj.meshes[0].scaling = new BABYLON.Vector3(-100, 100, 100);
		envObj.meshes[0].position = new BABYLON.Vector3(0, -900/*cm*/, 0); // 4階くらいの想定
		envObj.meshes[0].bakeCurrentTransformIntoVertices();
		for (const mesh of envObj.meshes) {
			mesh.isPickable = false;
			mesh.checkCollisions = false;

			//if (mesh.name === '__root__') continue;
			mesh.receiveShadows = false;
		}
	}

	private async loadRoomModel(type: RoomDef['roomType']) {
		const roomObj = await BABYLON.ImportMeshAsync('/client-assets/room/rooms/default.glb', this.scene);
		roomObj.meshes[0].scaling = new BABYLON.Vector3(-100, 100, 100);
		roomObj.meshes[0].bakeCurrentTransformIntoVertices();
		for (const mesh of roomObj.meshes) {
			//if (mesh.name === '__root__') continue;
			if (mesh.name.startsWith('_COLLISION_')) {
				mesh.receiveShadows = false;
				mesh.isVisible = false;
				mesh.checkCollisions = true;
				this.roomCollisionMeshes.push(mesh);
				continue;
			}

			mesh.isPickable = false;
			mesh.checkCollisions = false;
			mesh.receiveShadows = true;
			this.shadowGenerator1.addShadowCaster(mesh);
			this.shadowGenerator2.addShadowCaster(mesh);
		}
	}

	private async loadObject(o: RoomDef['objects'][0]) {
		const obj = await BABYLON.ImportMeshAsync(`/client-assets/room/objects/${o.type}/${o.type}.glb`, this.scene);
		obj.meshes[0].scaling = new BABYLON.Vector3(-100, 100, 100);
		obj.meshes[0].bakeCurrentTransformIntoVertices();
		obj.meshes[0].position = new BABYLON.Vector3(...o.position);
		obj.meshes[0].rotation = new BABYLON.Vector3(...o.rotation);

		for (const m of obj.meshes) {
			const mesh = m;

			mesh.metadata = { isObject: true, objectId: o.id, objectType: o.type };

			if (mesh.name.startsWith('_TV_SCREEN_')) {
				mesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.UVKind, true);
			}

			if (mesh.name.startsWith('_COLLISION_TOP_')) {
				mesh.isVisible = false;
				continue;
			}

			mesh.checkCollisions = true;
			//if (mesh.name === '__root__') continue;
			mesh.receiveShadows = true;
			this.shadowGenerator1.addShadowCaster(mesh);
			this.shadowGenerator2.addShadowCaster(mesh);

			mesh.renderOutline = false;
			mesh.outlineWidth = 0.003;
			mesh.outlineColor = new BABYLON.Color3(1, 0, 0);
		}

		this.objectMeshs.set(o.id, obj.meshes[0]);

		const objDef = OBJECTS[o.type];
		if (objDef != null && objDef.onInit != null) {
			objDef.onInit(this, o, obj);
		}
	}

	public toggleGrab() {
		if (this.grabbing != null) {
			// 親から先に外していく
			const removeStickyParentRecursively = (mesh: BABYLON.AbstractMesh) => {
				const stickyObjectIds = Array.from(this.def.objects.filter(o => o.sticky === mesh.metadata.objectId)).map(o => o.id);
				for (const soid of stickyObjectIds) {
					const soMesh = this.objectMeshs.get(soid)!;
					soMesh.parent = null;
					soMesh.position = soMesh.position.add(mesh.position);
					soMesh.rotation = soMesh.rotation.add(mesh.rotation);
					removeStickyParentRecursively(soMesh);
				}
			};
			removeStickyParentRecursively(this.grabbing.mesh);
			const pos = this.grabbing.mesh.position.clone();
			this.grabbing.ghost.dispose(false, true);
			this.grabbing = null;

			sound.playUrl('/client-assets/room/sfx/put.mp3', {
				volume: 1,
				playbackRate: 1,
			});

			this.putParticleSystem.emitter = pos;
			this.putParticleSystem.start();
			return;
		}

		if (this.highlightedObjectId == null) return;

		const highlightedObject = this.objectMeshs.get(this.highlightedObjectId)!;
		for (const om of highlightedObject.getChildMeshes()) {
			om.renderOutline = false;
		}
		const startDistance = BABYLON.Vector3.Distance(this.camera.position, highlightedObject.position);
		const ghost = highlightedObject.clone('ghost', null, false)!;
		ghost.metadata = { isGhost: true };
		for (const m of ghost.getChildMeshes()) {
			m.metadata = { isGhost: true };
			if (m.material) {
				const mat = m.material.clone(`${m.material.name}_ghost`);
				mat.alpha = 0.3;
				mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
				m.material = mat;
			}
		}

		// 子から先に適用していく
		const setStickyParentRecursively = (mesh: BABYLON.AbstractMesh) => {
			const stickyObjectIds = Array.from(this.def.objects.filter(o => o.sticky === mesh.metadata.objectId)).map(o => o.id);
			for (const soid of stickyObjectIds) {
				const soMesh = this.objectMeshs.get(soid)!;
				setStickyParentRecursively(soMesh);
				soMesh.parent = mesh;
				soMesh.position = soMesh.position.subtract(mesh.position);
				soMesh.rotation = soMesh.rotation.subtract(mesh.rotation);
			}
		};
		setStickyParentRecursively(highlightedObject);

		const descendantStickyObjectIds: string[] = [];
		const collectDescendantStickyObjectIds = (parentId: string) => {
			const childIds = Array.from(this.def.objects.filter(o => o.sticky === parentId)).map(o => o.id);
			for (const cid of childIds) {
				descendantStickyObjectIds.push(cid);
				collectDescendantStickyObjectIds(cid);
			}
		};
		collectDescendantStickyObjectIds(highlightedObject.metadata.objectId);

		this.grabbing = {
			objectId: highlightedObject.metadata.objectId,
			mesh: highlightedObject,
			startOffset: highlightedObject.position.subtract(this.camera.position.add(this.camera.getDirection(BABYLON.Axis.Z).scale(startDistance))),
			startRotationY: highlightedObject.rotation.subtract(this.camera.rotation).y,
			startDistance: startDistance,
			ghost: ghost,
			descendantStickyObjectIds,
		};

		sound.playUrl('/client-assets/room/sfx/grab.mp3', {
			volume: 1,
			playbackRate: 1,
		});
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
