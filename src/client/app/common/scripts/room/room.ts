import autobind from 'autobind-decorator';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { Furniture } from './furniture';
import { loadModel } from './load-model';
import uuid = require('uuid');

THREE.ImageUtils.crossOrigin = '';

export class Room {
	private scene: THREE.Scene;
	private renderer: THREE.WebGLRenderer;
	private camera: THREE.OrthographicCamera;
	private controls: OrbitControls;
	private composer: EffectComposer;
	private furnitures: Furniture[];
	private graphicsQuality: 'superLow' | 'veryLow' | 'low' | 'medium' | 'high' | 'ultra';
	private objects: THREE.Object3D[] = [];
	private selectedObject: THREE.Object3D = null;
	public canvas: HTMLCanvasElement;

	constructor(user, furnitures: Room['furnitures'], graphicsQuality: Room['graphicsQuality'], container) {
		this.furnitures = furnitures;
		this.graphicsQuality = graphicsQuality;

		const shadowQuality =
			graphicsQuality === 'ultra' ? 16384 :
			graphicsQuality === 'high' ? 8192 :
			graphicsQuality === 'medium' ? 4096 :
			graphicsQuality === 'low' ? 2048 :
			graphicsQuality === 'veryLow' ? 1024 :
			0; // superLow

		const isMyRoom = true;

		//#region Init a scene
		this.scene = new THREE.Scene();

		const width = window.innerWidth;
		const height = window.innerHeight;

		//#region Init a renderer
		this.renderer = new THREE.WebGLRenderer({
			antialias: false
		});

		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(width, height);
		this.renderer.autoClear = false;
		this.renderer.setClearColor(new THREE.Color(0x051f2d));
		this.renderer.shadowMap.enabled = this.graphicsQuality !== 'superLow';
		this.renderer.shadowMap.cullFace = THREE.CullFaceBack;

		this.canvas = this.renderer.domElement;
		container.appendChild(this.renderer.domElement);
		//#endregion

		//#region Init a camera
		this.camera = new THREE.OrthographicCamera(
			width / - 2, width / 2, height / 2, height / - 2, -10, 10);

		this.camera.zoom = 100;
		this.camera.position.x = 2;
		this.camera.position.y = 2;
		this.camera.position.z = 2;
		this.camera.updateProjectionMatrix();

		this.scene.add(this.camera);
		//#endregion

		//#region AmbientLight
		const ambientLight = new THREE.AmbientLight(0xffffff, 1);
		this.scene.add(ambientLight);
		//#endregion

		if (this.graphicsQuality !== 'superLow') {
			//#region Room light
			const roomLight = new THREE.SpotLight(0xffffff, 0.1);

			roomLight.position.set(0, 8, 0);
			roomLight.castShadow = true;
			roomLight.shadowBias = -0.0001;
			roomLight.shadowMapWidth = shadowQuality;
			roomLight.shadowMapHeight = shadowQuality;
			roomLight.shadowCameraNear = 0.1;
			roomLight.shadowCameraFar = 9;
			roomLight.shadowCameraFov = 45;

			this.scene.add(roomLight);
			//#endregion
		}

		//#region Out light
		const outLight = new THREE.SpotLight(0xffffff, 0.4);

		outLight.position.set(9, 3, -2);
		outLight.castShadow = true;
		outLight.shadowBias = -0.001; // アクネ、アーチファクト対策 その代わりピーターパンが発生する可能性がある
		outLight.shadowMapWidth = shadowQuality;
		outLight.shadowMapHeight = shadowQuality;
		outLight.shadowCameraNear = 6;
		outLight.shadowCameraFar = 15;
		outLight.shadowCameraFov = 45;

		this.scene.add(outLight);
		//#endregion

		//#region Init a controller
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);

		this.controls.target.set(0, 1, 0);
		this.controls.enableZoom = true;
		this.controls.enablePan = false;
		this.controls.minPolarAngle = 0;
		this.controls.maxPolarAngle = Math.PI / 2;
		this.controls.minAzimuthAngle = 0;
		this.controls.maxAzimuthAngle = Math.PI / 2;
		this.controls.mouseButtons.LEFT = 2;
		this.controls.mouseButtons.RIGHT = 0;
		//#endregion

		//#region POST FXs
		if (this.graphicsQuality === 'superLow') {
			this.composer = null;
		} else {
			const renderTarget = new THREE.WebGLRenderTarget(width, height, {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				format: THREE.RGBFormat,
				stencilBuffer: false,
			});

			const fxaa = new ShaderPass(FXAAShader);
			fxaa.uniforms['resolution'].value = new THREE.Vector2(1 / width, 1 / height);
			fxaa.renderToScreen = true;

			this.composer = new EffectComposer(this.renderer, renderTarget);
			this.composer.addPass(new RenderPass(this.scene, this.camera));
			//this.composer.addPass(new BloomPass(0.5, 25, 128.0, 512));
			this.composer.addPass(fxaa);
		}
		//#endregion
		//#endregion

		//#region Label
		//#region Avatar
		const avatarUrl = user.avatarUrl;

		const iconTexture = THREE.ImageUtils.loadTexture(avatarUrl);
		iconTexture.wrapS = THREE.RepeatWrapping;
		iconTexture.wrapT = THREE.RepeatWrapping;
		iconTexture.anisotropy = 16;

		const avatarMaterial = new THREE.MeshPhongMaterial({
			specular: 0x030303,
			emissive: 0x111111,
			map: iconTexture,
			side: THREE.DoubleSide,
			alphaTest: 0.5
		});

		const iconGeometry = new THREE.PlaneGeometry(1, 1);

		const avatarObject = new THREE.Mesh(iconGeometry, avatarMaterial);
		avatarObject.position.set(-3, 2.5, 2);
		avatarObject.rotation.y = Math.PI / 2;
		avatarObject.castShadow = false;

		this.scene.add(avatarObject);
		//#endregion

		//#region Username
		/*
		const name = user.username;

		const nameGeometry = new THREE.TextGeometry(name, {
			size: 0.5,
			height: 0,
			curveSegments: 8,
			font: 'helvetiker',
			weight: 'normal',
			style: 'normal',
			bevelThickness: 0,
			bevelSize: 0,
			bevelEnabled: false
		});

		const nameMaterial = new THREE.MeshLambertMaterial({
			color: 0xffffff
		});

		const nameObject = new THREE.Mesh(nameGeometry, nameMaterial);
		nameObject.position.set(-3, 2.25, 1.25);
		nameObject.rotation.y = Math.PI / 2;
		nameObject.castShadow = false;

		this.scene.add(nameObject);
		*/
		//#endregion
		//#endregion

		//#region Interaction
		if (isMyRoom) {
			// Hover highlight
			this.renderer.domElement.onmousemove = this.onmousemove;

			// Click
			this.renderer.domElement.onmousedown = this.onmousedown;
		}
		//#endregion

		//#region Init room
		const loader = new GLTFLoader();
		loader.load(`/assets/furnitures/room/room.glb`, gltf => {
			gltf.scene.traverse(child => {
				if (child instanceof THREE.Mesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});
			gltf.scene.position.set(0, 0, 0);
			this.scene.add(gltf.scene);
		});
		//#endregion

		//#region Load furnitures
		for (const furniture of furnitures) {
			loadModel(furniture).then(obj => {
				this.scene.add(obj.scene);
				this.objects.push(obj.scene);
			});
		}
		//#endregion

		// Start render
		if (this.graphicsQuality === 'superLow') {
			this.renderWithoutPostFXs();
		} else {
			this.renderWithPostFXs();
		}
	}

	@autobind
	private renderWithoutPostFXs() {
		requestAnimationFrame(this.renderWithoutPostFXs);
		this.controls.update();
		this.renderer.render(this.scene, this.camera);
	}

	@autobind
	private renderWithPostFXs() {
		requestAnimationFrame(this.renderWithPostFXs);
		this.controls.update();
		this.renderer.clear();
		this.composer.render();
	}

	@autobind
	private onmousemove(ev: MouseEvent) {
		const rect = (<HTMLElement>ev.target).getBoundingClientRect();
		const x = ((ev.clientX - rect.left) / this.renderer.domElement.width) * 2 - 1;
		const y = -((ev.clientY - rect.top) / this.renderer.domElement.height) * 2 + 1;
		const pos = new THREE.Vector2(x, y);

		this.camera.updateMatrixWorld();

		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(pos, this.camera);

		const intersects = raycaster.intersectObjects(this.objects, true);

		for (const object of this.objects) {
			object.traverse(child => {
				if (child instanceof THREE.Mesh) {
					if (child.isActive == null || !child.isActive) {
						child.material.emissive.setHex(0x000000);
					}
				}
			});
		}

		if (intersects.length > 0) {
			const INTERSECTED = intersects[0].object.parent;
			INTERSECTED.traverse(child => {
				if (child instanceof THREE.Mesh) {
					if (child.isActive == null || !child.isActive) {
						return child.material.emissive.setHex(0x191919);
					}
				}
			});
		}
	}

	@autobind
	private onmousedown(ev: MouseEvent) {
		if (ev.target !== this.renderer.domElement || ev.button !== 0) return;

		const rect = (<HTMLElement>ev.target).getBoundingClientRect();
		const x = ((ev.clientX - rect.left) / this.renderer.domElement.width) * 2 - 1;
		const y = -((ev.clientY - rect.top) / this.renderer.domElement.height) * 2 + 1;
		const pos = new THREE.Vector2(x, y);

		this.camera.updateMatrixWorld();

		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(pos, this.camera);

		const intersects = raycaster.intersectObjects(this.objects, true);

		for (const object of this.objects) {
			object.traverse(child => {
				if (child instanceof THREE.Mesh) {
					child.material.emissive.setHex(0x000000);
					child.isActive = false;
				}
			});
		}

		if (intersects.length > 0) {
			let found = false;
			let x = intersects[0].object.parent;
			while (!found) {
				if (x.parent.parent == null) {
					found = true;
				} else {
					x = x.parent;
				}
			}
			const selectedObj = x;
			this.selectFurniture(selectedObj);
		} else {
			this.selectedObject = null;
		}
	}

	@autobind
	private selectFurniture(obj: THREE.Object3D) {
		this.selectedObject = obj;
		obj.traverse(child => {
			if (child instanceof THREE.Mesh) {
				child.material.emissive.setHex(0xff0000);
				child.isActive = true;
			}
		});
	}

	@autobind
	public moveFurniture(x: number, y: number, z: number) {
		const obj = this.selectedObject;
		obj.position.x = x;
		obj.position.y = y;
		obj.position.z = z;

		const furniture = this.furnitures.find(furniture => furniture.id === obj.name);
		furniture.position.x = x;
		furniture.position.y = y;
		furniture.position.z = z;
	}

	@autobind
	public rotateFurniture(x: number, y: number, z: number) {
		const obj = this.selectedObject;
		obj.rotation.x = x;
		obj.rotation.y = y;
		obj.rotation.z = z;

		const furniture = this.furnitures.find(furniture => furniture.id === obj.name);
		furniture.rotation.x = x;
		furniture.rotation.y = y;
		furniture.rotation.z = z;
	}

	@autobind
	public addFurniture(type: string) {
		const furniture = {
			id: uuid(),
			type: type,
			position: {
				x: 0,
				y: 0,
				z: 0,
			},
			rotation: {
				x: 0,
				y: 0,
				z: 0,
			},
		};

		this.furnitures.push(furniture);

		loadModel(furniture).then(obj => {
			this.scene.add(obj.scene);
			this.objects.push(obj.scene);
		});
	}

	@autobind
	public removeFurniture() {
		const obj = this.selectedObject;
		this.scene.remove(obj);
		this.objects = this.objects.filter(object => object.name !== obj.name);
		this.furnitures = this.furnitures.filter(furniture => furniture.id !== obj.name);
		this.selectedObject = null;
	}

	@autobind
	public getFurnitures() {
		return this.furnitures;
	}
}
