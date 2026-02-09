/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { AxesViewer } from '@babylonjs/core/Debug/axesViewer';
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic';
import { MmdOutlineRenderer } from './outlineRenderer.ts';

type RoomDef = {
	roomType: 'default';
	objects: {
		id: string;
		type: string;
		position: [number, number, number];
		rotation: [number, number, number];
		parent: string | null;
	}[];
};

const OBJECTS = {
	plant: {
		placement: 'top',
	},
	mug: {
		placement: 'top',
	},
	stickyNote: {
		placement: 'side',
	},
};

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
	private scene: BABYLON.Scene;
	private shadowGenerator1: BABYLON.ShadowGenerator;
	private shadowGenerator2: BABYLON.ShadowGenerator;
	private camera: BABYLON.UniversalCamera;
	private camera2: BABYLON.ArcRotateCamera;
	private ROOM_SIZE = 300/*cm*/;
	private intervalIds: number[] = [];
	private objects: Map<string, BABYLON.AbstractMesh> = new Map();
	private grabbing: BABYLON.AbstractMesh | null = null;
	private grabbingStartDistance: number | null = null;
	private grabbingGhost: BABYLON.AbstractMesh | null = null;
	private highlightedObjectId: string | null = null;
	private time: 0 | 1 | 2 = 0; // 0: 昼, 1: 夕, 2: 夜

	public moveForward = false;
	public moveBackward = false;
	public moveLeft = false;
	public moveRight = false;

	constructor(options: {
		canvas: HTMLCanvasElement;
	}) {
		registerBuiltInLoaders();

		this.canvas = options.canvas;
		this.engine = new BABYLON.Engine(options.canvas, false, { alpha: false });
		this.scene = new BABYLON.Scene(this.engine);
		//this.scene.autoClear = true;
		if (this.time === 0) {
			this.scene.clearColor = new BABYLON.Color4(0.4, 0.8, 1.0, 0);
		} else if (this.time === 1) {
			this.scene.clearColor = new BABYLON.Color4(1.0, 0.7, 0.5, 0);
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

		const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: this.ROOM_SIZE, height: this.ROOM_SIZE }, this.scene);
		floor.isVisible = false;
		floor.checkCollisions = true;
		const wall1 = BABYLON.MeshBuilder.CreateBox('wall1', { width: this.ROOM_SIZE, height: 200/*cm*/, depth: 2/*cm*/ }, this.scene);
		wall1.position = new BABYLON.Vector3(0, 100/*cm*/, -this.ROOM_SIZE / 2);
		wall1.isVisible = false;
		wall1.checkCollisions = true;
		const wall2 = BABYLON.MeshBuilder.CreateBox('wall2', { width: this.ROOM_SIZE, height: 200/*cm*/, depth: 2/*cm*/ }, this.scene);
		wall2.position = new BABYLON.Vector3(0, 100/*cm*/, this.ROOM_SIZE / 2);
		wall2.isVisible = false;
		wall2.checkCollisions = true;
		const wall3 = BABYLON.MeshBuilder.CreateBox('wall3', { width: 2/*cm*/, height: 200/*cm*/, depth: this.ROOM_SIZE }, this.scene);
		wall3.position = new BABYLON.Vector3(-this.ROOM_SIZE / 2, 100/*cm*/, 0);
		wall3.isVisible = false;
		wall3.checkCollisions = true;
		const wall4 = BABYLON.MeshBuilder.CreateBox('wall4', { width: 2/*cm*/, height: 200/*cm*/, depth: this.ROOM_SIZE }, this.scene);
		wall4.position = new BABYLON.Vector3(this.ROOM_SIZE / 2, 100/*cm*/, 0);
		wall4.isVisible = false;
		wall4.checkCollisions = true;

		const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, -0.5), this.scene);
		ambientLight.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
		ambientLight.intensity = 0.5;

		const roomLight = new BABYLON.SpotLight('roomLight', new BABYLON.Vector3(0, 250/*cm*/, 0), new BABYLON.Vector3(0, -1, 0), 4, 8, this.scene);
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
		sunLight.diffuse = this.time === 2 ? new BABYLON.Color3(0.8, 0.9, 1.0) : new BABYLON.Color3(1.0, 0.9, 0.8);
		sunLight.intensity = this.time === 0 ? 2 : this.time === 2 ? 0.25 : 1;
		sunLight.shadowMinZ = 1000/*cm*/;
		sunLight.shadowMaxZ = 2000/*cm*/;

		this.shadowGenerator2 = new BABYLON.ShadowGenerator(4092, sunLight);
		this.shadowGenerator2.forceBackFacesOnly = true;
		this.shadowGenerator2.bias = 0.0001;
		this.shadowGenerator2.usePercentageCloserFiltering = true;
		this.shadowGenerator2.usePoissonSampling = true;

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
		}

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
				if (oid != null && this.objects.has(oid)) {
					const o = this.objects.get(oid)!;
					// focus camera
					this.camera.setTarget(o.position);
				}
			}
		});

		if (_DEV_) {
			new AxesViewer(this.scene, 5);

			//const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 30 }, this.scene);
			//sphere.position = new BABYLON.Vector3(0, 30, 0);
			//sphere.receiveShadows = true;
			//this.shadowGenerator1.addShadowCaster(sphere);
			//this.shadowGenerator2.addShadowCaster(sphere);
		}
	}

	public async init(def: RoomDef) {
		await this.loadRoomModel(def.roomType);
		await this.loadEnvModel();

		for (const objDef of def.objects) {
			this.loadObject(objDef.id, objDef.type, new BABYLON.Vector3(...objDef.position), new BABYLON.Vector3(...objDef.rotation));
		}

		function isIntersectXZ(a: BABYLON.BoundingBox, b: BABYLON.BoundingBox): boolean {
			return (a.minimumWorld.x <= b.maximumWorld.x &&
				a.maximumWorld.x >= b.minimumWorld.x) &&
			(a.minimumWorld.z <= b.maximumWorld.z &&
				a.maximumWorld.z >= b.minimumWorld.z);
		}

		this.intervalIds.push(window.setInterval(() => {
			if (this.grabbing != null) {
				const dir = this.camera.getDirection(BABYLON.Axis.Z);
				this.grabbingGhost.position = this.camera.position.add(dir.scale(this.grabbingStartDistance));

				let y = 0;

				for (const [id, o] of this.objects.entries().filter(([_id, o]) => o !== this.grabbing)) {
					for (const om of o.getChildMeshes()) {
						const omb = om.getBoundingInfo().boundingBox;
						for (const tm of this.grabbing.getChildMeshes()) {
							const tmb = tm.getBoundingInfo().boundingBox;
							if (isIntersectXZ(tmb, omb)) {
								const topY = omb.maximumWorld.y;
								if (y === 0 || topY > y) {
									y = topY;
								}
							}
						}
					}
				}

				this.grabbing.position = this.grabbingGhost.position.clone();
				this.grabbing.position.y = y;
			} else {
				this.highlightedObjectId = null;
				const ray = new BABYLON.Ray(this.camera.position, this.camera.getDirection(BABYLON.Axis.Z), 1000/*cm*/);
				for (const [id, o] of this.objects.entries()) {
					for (const om of o.getChildMeshes()) {
						om.renderOutline = false;
					}
				}
				const hit = this.scene.pickWithRay(ray)!;
				if (hit.pickedMesh != null) {
					const oid = hit.pickedMesh.metadata.objectId;
					if (oid != null && this.objects.has(oid)) {
						this.highlightedObjectId = oid;
						const o = this.objects.get(oid)!;
						for (const om of o.getChildMeshes()) {
							om.renderOutline = true;
						}
					}
				}
			}
		}, 10));

		this.engine.runRenderLoop(() => {
			//const ray = new BABYLON.Ray(this.camera.position, this.camera.getDirection(BABYLON.Axis.Z), 1000/*cm*/);
			//for (const mesh of this.scene.meshes) {
			//	if (mesh.outlineColor.equals(new BABYLON.Color3(1, 0, 0))) {
			//		mesh.outlineColor = new BABYLON.Color3(0, 0, 0);
			//	}
			//}
			//const hit = this.scene.pickWithRay(ray)!;
			//if (hit.pickedMesh != null) {
			//	hit.pickedMesh.outlineColor = new BABYLON.Color3(1, 0, 0);
			//}

			//if (this.camera.position.x > (this.ROOM_SIZE / 2) - 2/*cm*/) {
			//	this.camera.position.x = (this.ROOM_SIZE / 2) - 2/*cm*/;
			//} else if (this.camera.position.x < -(this.ROOM_SIZE / 2) + 2/*cm*/) {
			//	this.camera.position.x = -(this.ROOM_SIZE / 2) + 2/*cm*/;
			//}
			//if (this.camera.position.z > (this.ROOM_SIZE / 2) - 2/*cm*/) {
			//	this.camera.position.z = (this.ROOM_SIZE / 2) - 2/*cm*/;
			//} else if (this.camera.position.z < -(this.ROOM_SIZE / 2) + 2/*cm*/) {
			//	this.camera.position.z = -(this.ROOM_SIZE / 2) + 2/*cm*/;
			//}

			this.scene.render();
		});
	}

	private async loadEnvModel() {
		const envObj = await BABYLON.ImportMeshAsync('/client-assets/room/env.glb', this.scene);
		envObj.meshes[0].scaling = new BABYLON.Vector3(-100, 100, 100);
		envObj.meshes[0].position = new BABYLON.Vector3(0, -300/*cm*/, 0);
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
			console.log(mesh.name);
			mesh.isPickable = false;
			mesh.checkCollisions = false;

			//if (mesh.name === '__root__') continue;
			if (mesh.name.startsWith('Window')) {
				mesh.receiveShadows = false;
				continue;
			}
			mesh.receiveShadows = true;
			this.shadowGenerator1.addShadowCaster(mesh);
			this.shadowGenerator2.addShadowCaster(mesh);
		}
	}

	private async loadObject(id: string, type: RoomDef['objects'][number], position: BABYLON.Vector3, rotation: BABYLON.Vector3) {
		const obj = await BABYLON.ImportMeshAsync(`/client-assets/room/objects/${type}/${type}.glb`, this.scene);
		obj.meshes[0].scaling = new BABYLON.Vector3(-100, 100, 100);
		obj.meshes[0].bakeCurrentTransformIntoVertices();
		obj.meshes[0].position = position;
		obj.meshes[0].rotation = rotation;

		if (_DEV_) {
			obj.meshes[0].showBoundingBox = true;
		}

		for (const mesh of obj.meshes) {
			mesh.metadata = { isObject: true, objectId: id, objectType: type };
			mesh.checkCollisions = true;
			//if (mesh.name === '__root__') continue;
			mesh.receiveShadows = true;
			this.shadowGenerator1.addShadowCaster(mesh);
			this.shadowGenerator2.addShadowCaster(mesh);

			//if (mesh.material != null) {
			//	mesh.material.renderOutline = true;
			//	mesh.material.outlineWidth = 1;
			//	mesh.material.outlineColor = new BABYLON.Color3(0, 0, 0);
			//	mesh.material.outlineAlpha = 1.0;
			//}

			mesh.renderOutline = false;
			mesh.outlineWidth = 0.003;
			mesh.outlineColor = new BABYLON.Color3(1, 0, 0);
		}

		this.objects.set(id, obj.meshes[0]);

		if (type === 'mug') {
			const steamParticleSystem = new BABYLON.ParticleSystem('steamParticleSystem', 8, this.scene);
			steamParticleSystem.particleTexture = new BABYLON.Texture('/client-assets/room/steam.png');
			steamParticleSystem.emitter = position.add(new BABYLON.Vector3(0, 5/*cm*/, 0));
			steamParticleSystem.minEmitBox = new BABYLON.Vector3(-1/*cm*/, 0, -1/*cm*/);
			steamParticleSystem.maxEmitBox = new BABYLON.Vector3(1/*cm*/, 0, 1/*cm*/);
			steamParticleSystem.minEmitPower = 10;
			steamParticleSystem.maxEmitPower = 12;
			steamParticleSystem.minLifeTime = 1;
			steamParticleSystem.maxLifeTime = 3;
			steamParticleSystem.minSize = 10/*cm*/;
			steamParticleSystem.maxSize = 15/*cm*/;
			steamParticleSystem.direction1 = new BABYLON.Vector3(-0.3, 1, 0.3);
			steamParticleSystem.direction2 = new BABYLON.Vector3(0.3, 1, -0.3);
			steamParticleSystem.emitRate = 0.5;
			steamParticleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
			steamParticleSystem.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
			steamParticleSystem.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
			steamParticleSystem.colorDead = new BABYLON.Color4(1, 1, 1, 0);
			steamParticleSystem.start();
		}
	}

	public grab() {
		if (this.grabbing != null) {
			this.grabbing = null;
			this.grabbingStartDistance = null;
			if (this.grabbingGhost != null) {
				this.grabbingGhost.dispose(false, true);
				this.grabbingGhost = null;
			}
			return;
		}
		if (this.highlightedObjectId == null) return;
		const highlightedObject = this.objects.get(this.highlightedObjectId)!;
		this.grabbing = highlightedObject;
		this.grabbingStartDistance = BABYLON.Vector3.Distance(this.camera.position, highlightedObject.position);
		this.grabbingGhost = highlightedObject.clone('ghost', null, false);
		for (const m of this.grabbingGhost!.getChildMeshes()) {
			m.metadata = {};
			if (m.material) {
				const mat = m.material.clone(`${m.material.name}_ghost`);
				mat.alpha = 0.3;
				mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
				m.material = mat;
			}
		}
	}

	public destroy() {
		for (const id of this.intervalIds) {
			window.clearInterval(id);
		}
		this.intervalIds = [];
		this.engine.dispose();
	}
}
