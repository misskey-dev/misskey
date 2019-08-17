import autobind from 'autobind-decorator';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
//import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { Furniture, RoomInfo } from './furniture';
import uuid = require('uuid');
const furnitureDefs = require('./furnitures.json5');

THREE.ImageUtils.crossOrigin = '';

type Options = {
	graphicsQuality: Room['graphicsQuality'];
	onChangeSelect: Room['onChangeSelect'];
	useOrthographicCamera: boolean;
};

export class Room {
	private clock: THREE.Clock;
	private scene: THREE.Scene;
	private renderer: THREE.WebGLRenderer;
	private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
	private controls: OrbitControls;
	private composer: EffectComposer;
	private mixers: THREE.AnimationMixer[] = [];
	private roomInfo: RoomInfo;
	private graphicsQuality: 'superLow' | 'veryLow' | 'low' | 'medium' | 'high' | 'ultra';
	private roomObj: THREE.Object3D;
	private objects: THREE.Object3D[] = [];
	private selectedObject: THREE.Object3D = null;
	private onChangeSelect: Function;
	public canvas: HTMLCanvasElement;

	private get furnitures(): Furniture[] {
		return this.roomInfo.furnitures;
	}

	private set furnitures(furnitures: Furniture[]) {
		this.roomInfo.furnitures = furnitures;
	}

	constructor(user, roomInfo: RoomInfo, container, options: Options) {
		this.roomInfo = roomInfo;
		this.graphicsQuality = options.graphicsQuality;
		this.onChangeSelect = options.onChangeSelect;

		const shadowQuality =
			this.graphicsQuality === 'ultra' ? 16384 :
			this.graphicsQuality === 'high' ? 8192 :
			this.graphicsQuality === 'medium' ? 4096 :
			this.graphicsQuality === 'low' ? 2048 :
			this.graphicsQuality === 'veryLow' ? 1024 :
			0; // superLow

		const isMyRoom = true;

		this.clock = new THREE.Clock(true);

		//#region Init a scene
		this.scene = new THREE.Scene();

		const width = window.innerWidth;
		const height = window.innerHeight;

		//#region Init a renderer
		this.renderer = new THREE.WebGLRenderer({
			antialias: false,
			powerPreference:
				this.graphicsQuality === 'ultra' ? 'high-performance' :
				this.graphicsQuality === 'high' ? 'high-performance' :
				this.graphicsQuality === 'medium' ? 'default' :
				this.graphicsQuality === 'low' ? 'low-power' :
				this.graphicsQuality === 'veryLow' ? 'low-power' :
				'low-power' // superLow
		});

		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(width, height);
		this.renderer.autoClear = false;
		this.renderer.setClearColor(new THREE.Color(0x051f2d));
		this.renderer.shadowMap.enabled = this.graphicsQuality !== 'superLow';
		this.renderer.gammaOutput = true;
		this.renderer.shadowMap.type =
			this.graphicsQuality === 'ultra' ? THREE.PCFSoftShadowMap :
			this.graphicsQuality === 'high' ? THREE.PCFSoftShadowMap :
			this.graphicsQuality === 'medium' ? THREE.PCFShadowMap :
			this.graphicsQuality === 'low' ? THREE.BasicShadowMap :
			this.graphicsQuality === 'veryLow' ? THREE.BasicShadowMap :
			THREE.BasicShadowMap; // superLow

		this.canvas = this.renderer.domElement;
		container.appendChild(this.renderer.domElement);
		//#endregion

		//#region Init a camera
		this.camera = options.useOrthographicCamera
			? new THREE.OrthographicCamera(
				width / - 2, width / 2, height / 2, height / - 2, -10, 10)
			: new THREE.PerspectiveCamera(45, width / height);

		if (options.useOrthographicCamera) {
			this.camera.position.x = 2;
			this.camera.position.y = 2;
			this.camera.position.z = 2;
			this.camera.zoom = 100;
			this.camera.updateProjectionMatrix();
		} else {
			this.camera.position.x = 5;
			this.camera.position.y = 2;
			this.camera.position.z = 5;
		}

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
			roomLight.shadow.bias = -0.0001;
			roomLight.shadow.mapSize.width = shadowQuality;
			roomLight.shadow.mapSize.height = shadowQuality;
			roomLight.shadow.camera.near = 0.1;
			roomLight.shadow.camera.far = 9;
			roomLight.shadow.camera.fov = 45;

			this.scene.add(roomLight);
			//#endregion
		}

		//#region Out light
		const outLight = new THREE.SpotLight(0xffffff, 0.4);

		outLight.position.set(9, 3, -2);
		outLight.castShadow = true;
		outLight.shadow.bias = -0.001; // アクネ、アーチファクト対策 その代わりピーターパンが発生する可能性がある
		outLight.shadow.mapSize.width = shadowQuality;
		outLight.shadow.mapSize.height = shadowQuality;
		outLight.shadow.camera.near = 6;
		outLight.shadow.camera.far = 15;
		outLight.shadow.camera.fov = 45;

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

		const iconTexture = new THREE.TextureLoader().load(avatarUrl);
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
		const name = user.username;

		new THREE.FontLoader().load('/assets/fonts/helvetiker_regular.typeface.json', font => {
			const nameGeometry = new THREE.TextGeometry(name, {
				size: 0.5,
				height: 0,
				curveSegments: 8,
				font: font,
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
		});
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
		this.loadRoom();
		//#endregion

		//#region Load furnitures
		for (const furniture of this.furnitures) {
			this.loadFurniture(furniture).then(obj => {
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

		// Update animations
		const clock = this.clock.getDelta();
		for (const mixer of this.mixers) {
			mixer.update(clock);
		}

		this.controls.update();
		this.renderer.render(this.scene, this.camera);
	}

	@autobind
	private renderWithPostFXs() {
		requestAnimationFrame(this.renderWithPostFXs);

		// Update animations
		const clock = this.clock.getDelta();
		for (const mixer of this.mixers) {
			mixer.update(clock);
		}
		
		this.controls.update();
		this.renderer.clear();
		this.composer.render();
	}

	@autobind
	private loadRoom() {
		const loader = new GLTFLoader();
		loader.load(`/assets/room/rooms/${this.roomInfo.roomType}/${this.roomInfo.roomType}.glb`, gltf => {
			gltf.scene.traverse(child => {
				if (!(child instanceof THREE.Mesh)) return;
				child.castShadow = true;
				child.receiveShadow = true;
				child.material = new THREE.MeshLambertMaterial({
					color: (child.material as THREE.MeshStandardMaterial).color,
					map: (child.material as THREE.MeshStandardMaterial).map,
					name: (child.material as THREE.MeshStandardMaterial).name,
				});
			});
			gltf.scene.position.set(0, 0, 0);
			this.scene.add(gltf.scene);
			this.roomObj = gltf.scene;
			if (this.roomInfo.roomType === 'default') {
				this.applyCarpetColor();
			}
		});
	}

	@autobind
	private loadFurniture(furniture: Furniture) {
		const def = furnitureDefs.find(d => d.id === furniture.type);
		return new Promise<GLTF>((res, rej) => {
			const loader = new GLTFLoader();
			loader.load(`/assets/room/furnitures/${furniture.type}/${furniture.type}.glb`, gltf => {
				const model = gltf.scene;

				// Load animation
				if (gltf.animations.length > 0) { 
					const mixer = new THREE.AnimationMixer(model);
					this.mixers.push(mixer);
					for (const clip of gltf.animations) {
						mixer.clipAction(clip).play();
					}
				}

				model.name = furniture.id;
				model.position.x = furniture.position.x;
				model.position.y = furniture.position.y;
				model.position.z = furniture.position.z;
				model.rotation.x = furniture.rotation.x;
				model.rotation.y = furniture.rotation.y;
				model.rotation.z = furniture.rotation.z;

				model.traverse(child => {
					if (!(child instanceof THREE.Mesh)) return;
					child.castShadow = true;
					child.receiveShadow = true;
					child.material = new THREE.MeshLambertMaterial({
						color: (child.material as THREE.MeshStandardMaterial).color,
						map: (child.material as THREE.MeshStandardMaterial).map,
						name: (child.material as THREE.MeshStandardMaterial).name,
					});
				});

				if (def.color) { // カスタムカラー
					this.applyCustomColor(model);
				}

				if (def.texture) { // カスタムテクスチャ
					this.applyCustomTexture(model);
				}

				res(gltf);
			}, null, rej);
		});
	}

	@autobind
	private applyCarpetColor() {
		this.roomObj.traverse(child => {
			if (!(child instanceof THREE.Mesh)) return;
			child.castShadow = true;
			child.receiveShadow = true;

			// Apply carpet color
			if (child.material && (child.material as THREE.MeshStandardMaterial).name && (child.material as THREE.MeshStandardMaterial).name === 'Carpet') {
				(child.material as THREE.MeshStandardMaterial).color.setHex(parseInt(this.roomInfo.carpetColor.substr(1), 16));
			}
		});
	}

	@autobind
	public applyCustomColor(model: THREE.Object3D) {
		const furniture = this.furnitures.find(furniture => furniture.id === model.name);
		const def = furnitureDefs.find(d => d.id === furniture.type);
		if (def.color == null) return;
		model.traverse(child => {
			if (!(child instanceof THREE.Mesh)) return;
			for (const t of Object.keys(def.color)) {
				if (!child.material || !(child.material as THREE.MeshStandardMaterial).name || (child.material as THREE.MeshStandardMaterial).name !== t) continue;

				const prop = def.color[t];
				const val = furniture.props ? furniture.props[prop] : undefined;

				if (val == null) continue;

				(child.material as THREE.MeshStandardMaterial).color.setHex(parseInt(val.substr(1), 16));
			}
		});
	}

	@autobind
	public applyCustomTexture(model: THREE.Object3D) {
		const furniture = this.furnitures.find(furniture => furniture.id === model.name);
		const def = furnitureDefs.find(d => d.id === furniture.type);
		if (def.texture == null) return;
		model.traverse(child => {
			if (!(child instanceof THREE.Mesh)) return;
			for (const t of Object.keys(def.texture)) {
				if (child.name !== t) continue;

				const prop = def.texture[t].prop;
				const val = furniture.props ? furniture.props[prop] : undefined;

				if (val == null) continue;

				const canvas = document.createElement('canvas');
				canvas.height = 1024;
				canvas.width = 1024;

				child.material = new THREE.MeshPhongMaterial({
					specular: 0x030303,
					emissive: 0x111111,
					side: THREE.DoubleSide,
					alphaTest: 0.5,
				});

				const img = new Image;
				img.onload = () => {
					const uvInfo = def.texture[t].uv;

					const ctx = canvas.getContext('2d');
					ctx.drawImage(img, 0, 0, img.width, img.height, uvInfo.x, uvInfo.y, uvInfo.width, uvInfo.height);

					const texture = new THREE.Texture(canvas);
					texture.wrapS = THREE.RepeatWrapping;
					texture.wrapT = THREE.RepeatWrapping;
					texture.anisotropy = 16;
					texture.flipY = false;

					(child.material as THREE.MeshPhongMaterial).map = texture;
					(child.material as THREE.MeshPhongMaterial).needsUpdate = true;
					(child.material as THREE.MeshPhongMaterial).map.needsUpdate = true;
				};
				img.src = val;
			}
		});
	}

	@autobind
	private onmousemove(ev: MouseEvent) {
		const rect = (ev.target as HTMLElement).getBoundingClientRect();
		const x = (((ev.clientX * window.devicePixelRatio) - rect.left) / this.renderer.domElement.width) * 2 - 1;
		const y = -(((ev.clientY * window.devicePixelRatio) - rect.top) / this.renderer.domElement.height) * 2 + 1;
		const pos = new THREE.Vector2(x, y);

		this.camera.updateMatrixWorld();

		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(pos, this.camera);

		const intersects = raycaster.intersectObjects(this.objects, true);

		for (const object of this.objects) {
			if (this.isSelectedObject(object)) continue;
			object.traverse(child => {
				if (child instanceof THREE.Mesh) {
					(child.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
				}
			});
		}

		if (intersects.length > 0) {
			const intersected = this.getRoot(intersects[0].object);
			if (!this.isSelectedObject(intersected)) {
				intersected.traverse(child => {
					if (child instanceof THREE.Mesh) {
						(child.material as THREE.MeshStandardMaterial).emissive.setHex(0x191919);
					}
				});
			}
		}
	}

	@autobind
	private onmousedown(ev: MouseEvent) {
		if (ev.target !== this.renderer.domElement || ev.button !== 0) return;

		const rect = (ev.target as HTMLElement).getBoundingClientRect();
		const x = (((ev.clientX * window.devicePixelRatio) - rect.left) / this.renderer.domElement.width) * 2 - 1;
		const y = -(((ev.clientY * window.devicePixelRatio) - rect.top) / this.renderer.domElement.height) * 2 + 1;
		const pos = new THREE.Vector2(x, y);

		this.camera.updateMatrixWorld();

		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(pos, this.camera);

		const intersects = raycaster.intersectObjects(this.objects, true);

		for (const object of this.objects) {
			object.traverse(child => {
				if (child instanceof THREE.Mesh) {
					(child.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
				}
			});
		}

		if (intersects.length > 0) {
			const selectedObj = this.getRoot(intersects[0].object);
			this.selectFurniture(selectedObj);
		} else {
			this.selectedObject = null;
			this.onChangeSelect(null);
		}
	}

	@autobind
	private getRoot(obj: THREE.Object3D): THREE.Object3D {
		let found = false;
		let x = obj.parent;
		while (!found) {
			if (x.parent.parent == null) {
				found = true;
			} else {
				x = x.parent;
			}
		}
		return x;
	}

	@autobind
	private isSelectedObject(obj: THREE.Object3D): boolean {
		if (this.selectedObject == null) {
			return false;
		} else {
			return obj.name === this.selectedObject.name;
		}
	}

	@autobind
	private selectFurniture(obj: THREE.Object3D) {
		this.selectedObject = obj;
		this.onChangeSelect(obj);
		obj.traverse(child => {
			if (child instanceof THREE.Mesh) {
				(child.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
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
	public updateProp(key: string, value: any) {
		const furniture = this.furnitures.find(furniture => furniture.id === this.selectedObject.name);
		if (furniture.props == null) furniture.props = {};
		furniture.props[key] = value;
		this.applyCustomColor(this.selectedObject);
		this.applyCustomTexture(this.selectedObject);
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

		this.loadFurniture(furniture).then(obj => {
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
		this.onChangeSelect(null);
	}

	@autobind
	public updateCarpetColor(color: string) {
		this.roomInfo.carpetColor = color;
		this.applyCarpetColor();
	}

	@autobind
	public changeRoomType(type: string) {
		this.roomInfo.roomType = type;
		this.scene.remove(this.roomObj);
		this.loadRoom();
	}

	@autobind
	public getRoomInfo() {
		return this.roomInfo;
	}

	@autobind
	public getSelectedObject() {
		return this.selectedObject;
	}

	@autobind
	public findFurnitureById(id: string) {
		return this.furnitures.find(furniture => furniture.id === id);
	}
}
