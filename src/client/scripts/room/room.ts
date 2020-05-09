import autobind from 'autobind-decorator';
import { v4 as uuid } from 'uuid';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { Furniture, RoomInfo } from './furniture';
import { query as urlQuery } from '../../../prelude/url';
const furnitureDefs = require('./furnitures.json5');

THREE.ImageUtils.crossOrigin = '';

type Options = {
	graphicsQuality: Room['graphicsQuality'];
	onChangeSelect: Room['onChangeSelect'];
	useOrthographicCamera: boolean;
};

/**
 * MisskeyRoom Core Engine
 */
export class Room {
	private clock: THREE.Clock;
	private scene: THREE.Scene;
	private renderer: THREE.WebGLRenderer;
	private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
	private controls: OrbitControls;
	private composer: EffectComposer;
	private mixers: THREE.AnimationMixer[] = [];
	private furnitureControl: TransformControls;
	private roomInfo: RoomInfo;
	private graphicsQuality: 'cheep' | 'low' | 'medium' | 'high' | 'ultra';
	private roomObj: THREE.Object3D;
	private objects: THREE.Object3D[] = [];
	private selectedObject: THREE.Object3D = null;
	private onChangeSelect: Function;
	private isTransformMode = false;
	private renderFrameRequestId: number;

	private get canvas(): HTMLCanvasElement {
		return this.renderer.domElement;
	}

	private get furnitures(): Furniture[] {
		return this.roomInfo.furnitures;
	}

	private set furnitures(furnitures: Furniture[]) {
		this.roomInfo.furnitures = furnitures;
	}

	private get enableShadow() {
		return this.graphicsQuality != 'cheep';
	}

	private get usePostFXs() {
		return this.graphicsQuality !== 'cheep' && this.graphicsQuality !== 'low';
	}

	private get shadowQuality() {
		return (
			this.graphicsQuality === 'ultra' ? 16384 :
			this.graphicsQuality === 'high' ? 8192 :
			this.graphicsQuality === 'medium' ? 4096 :
			this.graphicsQuality === 'low' ? 1024 :
			0); // cheep
	}

	constructor(user, isMyRoom, roomInfo: RoomInfo, container: Element, options: Options) {
		this.roomInfo = roomInfo;
		this.graphicsQuality = options.graphicsQuality;
		this.onChangeSelect = options.onChangeSelect;

		this.clock = new THREE.Clock(true);

		//#region Init a scene
		this.scene = new THREE.Scene();

		const width = container.clientWidth;
		const height = container.clientHeight;

		//#region Init a renderer
		this.renderer = new THREE.WebGLRenderer({
			antialias: false,
			stencil: false,
			alpha: false,
			powerPreference:
				this.graphicsQuality === 'ultra' ? 'high-performance' :
				this.graphicsQuality === 'high' ? 'high-performance' :
				this.graphicsQuality === 'medium' ? 'default' :
				this.graphicsQuality === 'low' ? 'low-power' :
				'low-power' // cheep
		});

		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(width, height);
		this.renderer.autoClear = false;
		this.renderer.setClearColor(new THREE.Color(0x051f2d));
		this.renderer.shadowMap.enabled = this.enableShadow;
		this.renderer.shadowMap.type =
			this.graphicsQuality === 'ultra' ? THREE.PCFSoftShadowMap :
			this.graphicsQuality === 'high' ? THREE.PCFSoftShadowMap :
			this.graphicsQuality === 'medium' ? THREE.PCFShadowMap :
			this.graphicsQuality === 'low' ? THREE.BasicShadowMap :
			THREE.BasicShadowMap; // cheep

		container.insertBefore(this.canvas, container.firstChild);
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

		if (this.graphicsQuality !== 'cheep') {
			//#region Room light
			const roomLight = new THREE.SpotLight(0xffffff, 0.1);

			roomLight.position.set(0, 8, 0);
			roomLight.castShadow = this.enableShadow;
			roomLight.shadow.bias = -0.0001;
			roomLight.shadow.mapSize.width = this.shadowQuality;
			roomLight.shadow.mapSize.height = this.shadowQuality;
			roomLight.shadow.camera.near = 0.1;
			roomLight.shadow.camera.far = 9;
			roomLight.shadow.camera.fov = 45;

			this.scene.add(roomLight);
			//#endregion
		}

		//#region Out light
		const outLight1 = new THREE.SpotLight(0xffffff, 0.4);
		outLight1.position.set(9, 3, -2);
		outLight1.castShadow = this.enableShadow;
		outLight1.shadow.bias = -0.001; // アクネ、アーチファクト対策 その代わりピーターパンが発生する可能性がある
		outLight1.shadow.mapSize.width = this.shadowQuality;
		outLight1.shadow.mapSize.height = this.shadowQuality;
		outLight1.shadow.camera.near = 6;
		outLight1.shadow.camera.far = 15;
		outLight1.shadow.camera.fov = 45;
		this.scene.add(outLight1);

		const outLight2 = new THREE.SpotLight(0xffffff, 0.2);
		outLight2.position.set(-2, 3, 9);
		outLight2.castShadow = false;
		outLight2.shadow.bias = -0.001; // アクネ、アーチファクト対策 その代わりピーターパンが発生する可能性がある
		outLight2.shadow.camera.near = 6;
		outLight2.shadow.camera.far = 15;
		outLight2.shadow.camera.fov = 45;
		this.scene.add(outLight2);
		//#endregion

		//#region Init a controller
		this.controls = new OrbitControls(this.camera, this.canvas);

		this.controls.target.set(0, 1, 0);
		this.controls.enableZoom = true;
		this.controls.enablePan = isMyRoom;
		this.controls.minPolarAngle = 0;
		this.controls.maxPolarAngle = Math.PI / 2;
		this.controls.minAzimuthAngle = 0;
		this.controls.maxAzimuthAngle = Math.PI / 2;
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.2;
		//#endregion

		//#region POST FXs
		if (!this.usePostFXs) {
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
			if (this.graphicsQuality === 'ultra') {
				this.composer.addPass(new BloomPass(0.25, 30, 128.0, 512));
			}
			this.composer.addPass(fxaa);
		}
		//#endregion
		//#endregion

		//#region Label
		//#region Avatar
		const avatarUrl = `/proxy/?${urlQuery({ url: user.avatarUrl })}`;

		const textureLoader = new THREE.TextureLoader();
		textureLoader.crossOrigin = 'anonymous';

		const iconTexture = textureLoader.load(avatarUrl);
		iconTexture.wrapS = THREE.RepeatWrapping;
		iconTexture.wrapT = THREE.RepeatWrapping;
		iconTexture.anisotropy = 16;

		const avatarMaterial = new THREE.MeshBasicMaterial({
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
			this.furnitureControl = new TransformControls(this.camera, this.canvas);
			this.scene.add(this.furnitureControl);

			// Hover highlight
			this.canvas.onmousemove = this.onmousemove;

			// Click
			this.canvas.onmousedown = this.onmousedown;
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
		if (this.usePostFXs) {
			this.renderWithPostFXs();
		} else {
			this.renderWithoutPostFXs();
		}
	}

	@autobind
	private renderWithoutPostFXs() {
		this.renderFrameRequestId =
			window.requestAnimationFrame(this.renderWithoutPostFXs);

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
		this.renderFrameRequestId =
			window.requestAnimationFrame(this.renderWithPostFXs);

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
		const type = this.roomInfo.roomType;
		new GLTFLoader().load(`/assets/room/rooms/${type}/${type}.glb`, gltf => {
			gltf.scene.traverse(child => {
				if (!(child instanceof THREE.Mesh)) return;

				child.receiveShadow = this.enableShadow;

				child.material = new THREE.MeshLambertMaterial({
					color: (child.material as THREE.MeshStandardMaterial).color,
					map: (child.material as THREE.MeshStandardMaterial).map,
					name: (child.material as THREE.MeshStandardMaterial).name,
				});

				// 異方性フィルタリング
				if ((child.material as THREE.MeshLambertMaterial).map && this.graphicsQuality !== 'cheep') {
					(child.material as THREE.MeshLambertMaterial).map.minFilter = THREE.LinearMipMapLinearFilter;
					(child.material as THREE.MeshLambertMaterial).map.magFilter = THREE.LinearMipMapLinearFilter;
					(child.material as THREE.MeshLambertMaterial).map.anisotropy = 8;
				}
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
					child.castShadow = this.enableShadow;
					child.receiveShadow = this.enableShadow;
					(child.material as THREE.MeshStandardMaterial).metalness = 0;

					// 異方性フィルタリング
					if ((child.material as THREE.MeshStandardMaterial).map && this.graphicsQuality !== 'cheep') {
						(child.material as THREE.MeshStandardMaterial).map.minFilter = THREE.LinearMipMapLinearFilter;
						(child.material as THREE.MeshStandardMaterial).map.magFilter = THREE.LinearMipMapLinearFilter;
						(child.material as THREE.MeshStandardMaterial).map.anisotropy = 8;
					}
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
			if (child.material &&
				(child.material as THREE.MeshStandardMaterial).name &&
				(child.material as THREE.MeshStandardMaterial).name === 'Carpet'
			) {
				const colorHex = parseInt(this.roomInfo.carpetColor.substr(1), 16);
				(child.material as THREE.MeshStandardMaterial).color.setHex(colorHex);
			}
		});
	}

	@autobind
	private applyCustomColor(model: THREE.Object3D) {
		const furniture = this.furnitures.find(furniture => furniture.id === model.name);
		const def = furnitureDefs.find(d => d.id === furniture.type);
		if (def.color == null) return;
		model.traverse(child => {
			if (!(child instanceof THREE.Mesh)) return;
			for (const t of Object.keys(def.color)) {
				if (!child.material ||
					!(child.material as THREE.MeshStandardMaterial).name ||
					(child.material as THREE.MeshStandardMaterial).name !== t
				) continue;

				const prop = def.color[t];
				const val = furniture.props ? furniture.props[prop] : undefined;

				if (val == null) continue;

				const colorHex = parseInt(val.substr(1), 16);
				(child.material as THREE.MeshStandardMaterial).color.setHex(colorHex);
			}
		});
	}

	@autobind
	private applyCustomTexture(model: THREE.Object3D) {
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

				child.material = new THREE.MeshLambertMaterial({
					emissive: 0x111111,
					side: THREE.DoubleSide,
					alphaTest: 0.5,
				});

				const img = new Image();
				img.crossOrigin = 'anonymous';
				img.onload = () => {
					const uvInfo = def.texture[t].uv;

					const ctx = canvas.getContext('2d');
					ctx.drawImage(img,
						0, 0, img.width, img.height,
						uvInfo.x, uvInfo.y, uvInfo.width, uvInfo.height);

					const texture = new THREE.Texture(canvas);
					texture.wrapS = THREE.RepeatWrapping;
					texture.wrapT = THREE.RepeatWrapping;
					texture.anisotropy = 16;
					texture.flipY = false;

					(child.material as THREE.MeshLambertMaterial).map = texture;
					(child.material as THREE.MeshLambertMaterial).needsUpdate = true;
					(child.material as THREE.MeshLambertMaterial).map.needsUpdate = true;
				};
				img.src = val;
			}
		});
	}

	@autobind
	private onmousemove(ev: MouseEvent) {
		if (this.isTransformMode) return;

		const rect = (ev.target as HTMLElement).getBoundingClientRect();
		const x = (((ev.clientX * window.devicePixelRatio) - rect.left) / this.canvas.width) * 2 - 1;
		const y = -(((ev.clientY * window.devicePixelRatio) - rect.top) / this.canvas.height) * 2 + 1;
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
			if (this.isSelectedObject(intersected)) return;
			intersected.traverse(child => {
				if (child instanceof THREE.Mesh) {
					(child.material as THREE.MeshStandardMaterial).emissive.setHex(0x191919);
				}
			});
		}
	}

	@autobind
	private onmousedown(ev: MouseEvent) {
		if (this.isTransformMode) return;
		if (ev.target !== this.canvas || ev.button !== 0) return;

		const rect = (ev.target as HTMLElement).getBoundingClientRect();
		const x = (((ev.clientX * window.devicePixelRatio) - rect.left) / this.canvas.width) * 2 - 1;
		const y = -(((ev.clientY * window.devicePixelRatio) - rect.top) / this.canvas.height) * 2 + 1;
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

	/**
	 * 家具の移動/回転モードにします
	 * @param type 移動か回転か
	 */
	@autobind
	public enterTransformMode(type: 'translate' | 'rotate') {
		this.isTransformMode = true;
		this.furnitureControl.setMode(type);
		this.furnitureControl.attach(this.selectedObject);
		this.controls.enableRotate = false;
	}

	/**
	 * 家具の移動/回転モードを終了します
	 */
	@autobind
	public exitTransformMode() {
		this.isTransformMode = false;
		this.furnitureControl.detach();
		this.controls.enableRotate = true;
	}

	/**
	 * 家具プロパティを更新します
	 * @param key プロパティ名
	 * @param value 値
	 */
	@autobind
	public updateProp(key: string, value: any) {
		const furniture = this.furnitures.find(furniture => furniture.id === this.selectedObject.name);
		if (furniture.props == null) furniture.props = {};
		furniture.props[key] = value;
		this.applyCustomColor(this.selectedObject);
		this.applyCustomTexture(this.selectedObject);
	}

	/**
	 * 部屋に家具を追加します
	 * @param type 家具の種類
	 */
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

	/**
	 * 現在選択されている家具を部屋から削除します
	 */
	@autobind
	public removeFurniture() {
		this.exitTransformMode();
		const obj = this.selectedObject;
		this.scene.remove(obj);
		this.objects = this.objects.filter(object => object.name !== obj.name);
		this.furnitures = this.furnitures.filter(furniture => furniture.id !== obj.name);
		this.selectedObject = null;
		this.onChangeSelect(null);
	}

	/**
	 * 全ての家具を部屋から削除します
	 */
	@autobind
	public removeAllFurnitures() {
		this.exitTransformMode();
		for (const obj of this.objects) {
			this.scene.remove(obj);
		}
		this.objects = [];
		this.furnitures = [];
		this.selectedObject = null;
		this.onChangeSelect(null);
	}

	/**
	 * 部屋の床の色を変更します
	 * @param color 色
	 */
	@autobind
	public updateCarpetColor(color: string) {
		this.roomInfo.carpetColor = color;
		this.applyCarpetColor();
	}

	/**
	 * 部屋の種類を変更します
	 * @param type 種類
	 */
	@autobind
	public changeRoomType(type: string) {
		this.roomInfo.roomType = type;
		this.scene.remove(this.roomObj);
		this.loadRoom();
	}

	/**
	 * 部屋データを取得します
	 */
	@autobind
	public getRoomInfo() {
		for (const obj of this.objects) {
			const furniture = this.furnitures.find(f => f.id === obj.name);
			furniture.position.x = obj.position.x;
			furniture.position.y = obj.position.y;
			furniture.position.z = obj.position.z;
			furniture.rotation.x = obj.rotation.x;
			furniture.rotation.y = obj.rotation.y;
			furniture.rotation.z = obj.rotation.z;
		}

		return this.roomInfo;
	}

	/**
	 * 選択されている家具を取得します
	 */
	@autobind
	public getSelectedObject() {
		return this.selectedObject;
	}

	@autobind
	public findFurnitureById(id: string) {
		return this.furnitures.find(furniture => furniture.id === id);
	}

	/**
	 * レンダリングを終了します
	 */
	@autobind
	public destroy() {
		// Stop render loop
		window.cancelAnimationFrame(this.renderFrameRequestId);

		this.controls.dispose();
		this.scene.dispose();
	}
}
