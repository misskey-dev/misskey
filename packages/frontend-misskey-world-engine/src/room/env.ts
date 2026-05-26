
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { cm, WORLD_SCALE } from '../utility.js';
import { findMaterial, GRAPHICS_QUALITY, SYSTEM_HEYA_MESH_NAMES } from './utility.js';
import type { RoomEngine } from './engine.js';

//export interface EnvManager<T = any> {
//	constructor(onMeshUpdatedCallback?: ((meshes: BABYLON.AbstractMesh[]) => void) | null): void;
//	load: (options: T, scene: BABYLON.Scene) => Promise<void>;
//	applyOptions: (options: T) => void;
//	dispose: () => void;
//}

export abstract class EnvManager<T = any> {
	protected engine: RoomEngine;
	protected onMeshUpdatedCallback: ((meshes: BABYLON.AbstractMesh[]) => void) | null = null;
	public abstract envMapIndoor: BABYLON.CubeTexture | null;
	public abstract maxCameraZ: number;
	protected shadowGenerators: BABYLON.ShadowGenerator[] = [];

	constructor(engine: RoomEngine, onMeshUpdatedCallback?: ((meshes: BABYLON.AbstractMesh[]) => void) | null) {
		this.engine = engine;
		this.onMeshUpdatedCallback = onMeshUpdatedCallback ?? null;
	}

	abstract load(options: T, scene: BABYLON.Scene, engine: RoomEngine): Promise<void>;
	abstract applyOptions(options: T): void;
	abstract setTime(time: number): void;
	abstract updateRoomLightColor(color: BABYLON.Color3): void;
	abstract turnOnRoomLight(): void;
	abstract turnOffRoomLight(): void;

	public addShadowCaster(mesh: BABYLON.AbstractMesh) {
		for (const shadowGen of this.shadowGenerators) {
			shadowGen.addShadowCaster(mesh);
		}
	}

	public removeShadowCaster(mesh: BABYLON.AbstractMesh) {
		for (const shadowGen of this.shadowGenerators) {
			shadowGen.removeShadowCaster(mesh);
		}
	}

	public dispose() {
		for (const shadowGen of this.shadowGenerators) {
			shadowGen.dispose();
		}
	}
}

// TODO: マテリアルは必要になるまで作成しないようにする

export class SimpleEnvManager extends EnvManager<SimpleEnvOptions> {
	private loaderResult: BABYLON.ISceneLoaderAsyncResult | null = null;
	private meshes: BABYLON.Mesh[] = [];
	private wallRoots: Record<'n' | 's' | 'w' | 'e', BABYLON.TransformNode> = null as any;
	private wallMaterials: Record<'n' | 's' | 'w' | 'e', BABYLON.PBRMaterial> | null = null;
	private wallBeamMaterials: Record<'n' | 's' | 'w' | 'e', BABYLON.PBRMaterial> | null = null;
	private pillarRoots: Record<'nw' | 'ne' | 'sw' | 'se', BABYLON.TransformNode> | null = null;
	private pillarMaterials: Record<'nw' | 'ne' | 'sw' | 'se', BABYLON.PBRMaterial> | null = null;
	private ceilingMaterial: BABYLON.PBRMaterial | null = null;
	private floorMaterial: BABYLON.PBRMaterial | null = null;
	private skybox: BABYLON.Mesh | null = null;
	private skyboxMat: BABYLON.StandardMaterial | null = null;
	private roomLight: BABYLON.SpotLight | null = null;
	private sunLight: BABYLON.DirectionalLight | null = null;
	public envMapIndoor: BABYLON.CubeTexture | null = null;
	public maxCameraZ = cm(1000);

	constructor(engine: RoomEngine, onMeshUpdatedCallback?: ((meshes: BABYLON.AbstractMesh[]) => void) | null) {
		super(engine, onMeshUpdatedCallback);
	}

	public async load(options: SimpleEnvOptions) {
		this.skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: cm(1000) }, this.engine.scene);
		this.skyboxMat = new BABYLON.StandardMaterial('skyboxMat', this.engine.scene);
		this.skyboxMat.backFaceCulling = false;
		this.skyboxMat.disableLighting = true;
		this.skybox.material = this.skyboxMat;
		this.skybox.infiniteDistance = true;

		this.roomLight = new BABYLON.SpotLight('simpleEnv:RoomLight', new BABYLON.Vector3(0, cm(249), 0), new BABYLON.Vector3(0, -1, 0), 16, 8, this.engine.scene);
		this.roomLight.diffuse = new BABYLON.Color3(...this.engine.roomState.roomLightColor);
		this.roomLight.shadowMinZ = cm(10);
		this.roomLight.shadowMaxZ = cm(300);
		this.roomLight.radius = cm(30);

		if (this.engine.graphicsQuality >= GRAPHICS_QUALITY.MEDIUM) {
			const shadowGeneratorForRoomLight = new BABYLON.ShadowGenerator(this.engine.graphicsQuality <= GRAPHICS_QUALITY.MEDIUM ? 1024 : 2048, this.roomLight);
			shadowGeneratorForRoomLight.forceBackFacesOnly = true;
			shadowGeneratorForRoomLight.bias = 0.0005;
			shadowGeneratorForRoomLight.usePercentageCloserFiltering = true;
			shadowGeneratorForRoomLight.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
			if (this.engine.graphicsQuality <= GRAPHICS_QUALITY.MEDIUM) {
				shadowGeneratorForRoomLight.getShadowMap().refreshRate = 60; // 効いてなさそう babylonのバグ？
			}
			//shadowGeneratorForRoomLight.useContactHardeningShadow = true;
			//shadowGeneratorForRoomLight.contactHardeningLightSizeUVRatio = 0.01;
			this.shadowGenerators.push(shadowGeneratorForRoomLight);
		}

		if (this.engine.graphicsQuality >= GRAPHICS_QUALITY.MEDIUM) {
			this.sunLight = new BABYLON.DirectionalLight('simpleEnv:SunLight', new BABYLON.Vector3(0.2, -1, -1), this.engine.scene);
			this.sunLight.position = new BABYLON.Vector3(cm(-20), cm(1000), cm(1000));
			this.sunLight.shadowMinZ = cm(1000);
			this.sunLight.shadowMaxZ = cm(2000);

			const shadowGeneratorForSunLight = new BABYLON.ShadowGenerator(this.engine.graphicsQuality <= GRAPHICS_QUALITY.MEDIUM ? 1024 : 2048, this.sunLight);
			shadowGeneratorForSunLight.forceBackFacesOnly = true;
			shadowGeneratorForSunLight.bias = 0.00001;
			shadowGeneratorForSunLight.usePercentageCloserFiltering = true;
			shadowGeneratorForSunLight.usePoissonSampling = true;
			if (this.engine.graphicsQuality <= GRAPHICS_QUALITY.MEDIUM) {
				shadowGeneratorForSunLight.getShadowMap().refreshRate = 60; // 効いてなさそう babylonのバグ？
			}
			this.shadowGenerators.push(shadowGeneratorForSunLight);
		}

		this.loaderResult = await BABYLON.ImportMeshAsync('/client-assets/room/envs/default/300.glb', this.engine.scene);

		this.envMapIndoor = BABYLON.CubeTexture.CreateFromPrefilteredData('/client-assets/room/indoor.env', this.engine.scene);
		this.envMapIndoor.boundingBoxSize = new BABYLON.Vector3(cm(500), cm(500), cm(500));

		this.meshes = this.loaderResult.meshes.filter(m => m instanceof BABYLON.Mesh);
		this.meshes[0].scaling = this.meshes[0].scaling.scale(WORLD_SCALE);
		this.meshes[0].rotationQuaternion = null;
		this.meshes[0].rotation = new BABYLON.Vector3(0, 0, 0);

		// instanced mesh を通常の mesh に変換 (そうしないとマテリアルが共有される)
		for (const mesh of this.loaderResult.meshes) {
			if (mesh instanceof BABYLON.InstancedMesh) {
				const realizedMesh = mesh.sourceMesh.clone(mesh.name, null, true);

				realizedMesh.position = mesh.position.clone();
				if (mesh.rotationQuaternion) {
					realizedMesh.rotationQuaternion = mesh.rotationQuaternion.clone();
				} else {
					realizedMesh.rotation = mesh.rotation.clone();
				}
				realizedMesh.scaling = mesh.scaling.clone();
				realizedMesh.parent = mesh.parent;

				mesh.dispose();
				this.engine.scene.removeMesh(mesh);
				this.meshes.push(realizedMesh);
			}
		}

		this.wallRoots = {
			n: this.loaderResult.transformNodes.find(t => t.name.includes('__WALL_N__'))!,
			s: this.loaderResult.transformNodes.find(t => t.name.includes('__WALL_S__'))!,
			w: this.loaderResult.transformNodes.find(t => t.name.includes('__WALL_W__'))!,
			e: this.loaderResult.transformNodes.find(t => t.name.includes('__WALL_E__'))!,
		};

		this.pillarRoots = {
			nw: this.loaderResult.transformNodes.find(t => t.name.includes('__PILLAR_NW__'))!,
			ne: this.loaderResult.transformNodes.find(t => t.name.includes('__PILLAR_NE__'))!,
			sw: this.loaderResult.transformNodes.find(t => t.name.includes('__PILLAR_SW__'))!,
			se: this.loaderResult.transformNodes.find(t => t.name.includes('__PILLAR_SE__'))!,
		};

		const wallMaterial = findMaterial(this.meshes[0], '__WALL__');
		//wallMaterial.metadata.disableEnvMap = true;
		this.wallMaterials = {
			n: wallMaterial.clone('wallNMaterial'),
			s: wallMaterial.clone('wallSMaterial'),
			w: wallMaterial.clone('wallWMaterial'),
			e: wallMaterial.clone('wallEMaterial'),
		};

		const beamMaterial = findMaterial(this.meshes[0], '__BEAM__');
		//beamMaterial.metadata.disableEnvMap = true;
		this.wallBeamMaterials = {
			n: beamMaterial.clone('wallNBeamMaterial'),
			s: beamMaterial.clone('wallSBeamMaterial'),
			w: beamMaterial.clone('wallWBeamMaterial'),
			e: beamMaterial.clone('wallEBeamMaterial'),
		};

		const pillarMaterial = findMaterial(this.meshes[0], '__PILLAR__');
		//pillarMaterial.metadata.disableEnvMap = true;
		this.pillarMaterials = {
			nw: pillarMaterial.clone('pillarNWMaterial'),
			ne: pillarMaterial.clone('pillarNEMaterial'),
			sw: pillarMaterial.clone('pillarSWMaterial'),
			se: pillarMaterial.clone('pillarSEMaterial'),
		};

		for (const [k, v] of Object.entries(this.wallRoots)) {
			for (const m of v.getChildMeshes().filter(m => m.material === wallMaterial)) {
				m.material = this.wallMaterials[k];
			}
			for (const m of v.getChildMeshes().filter(m => m.material === beamMaterial)) {
				m.material = this.wallBeamMaterials[k];
			}
		}
		for (const [k, v] of Object.entries(this.pillarRoots)) {
			for (const m of v.getChildMeshes().filter(m => m.material === pillarMaterial)) {
				m.material = this.pillarMaterials[k];
			}
		}

		this.ceilingMaterial = findMaterial(this.meshes[0], '__CEILING__');
		//this.ceilingMaterial.metadata.disableEnvMap = true;
		this.floorMaterial = findMaterial(this.meshes[0], '__FLOOR__');
		//this.floorMaterial.metadata.disableEnvMap = true;

		const baseboardMaterial = findMaterial(this.meshes[0], '__BASEBOARD__');
		//baseboardMaterial.metadata.disableEnvMap = true;

		for (const mesh of this.meshes) {
			if (SYSTEM_HEYA_MESH_NAMES.some(name => mesh.name.includes(name))) continue;
			mesh.receiveShadows = true;

			if (mesh.material !== this.floorMaterial) { // 床は他の何にも影を落とさないことが確定している
				this.addShadowCaster(mesh);
			}

			const mat = mesh.material;
			if (mat instanceof BABYLON.MultiMaterial) {
				for (const subMat of mat.subMaterials) {
					subMat.reflectionTexture = this.envMapIndoor;
				}
			} else if (mat instanceof BABYLON.PBRMaterial) {
				mat.reflectionTexture = this.envMapIndoor;
			}
		}

		await this.applyOptions(options);
	}

	public setTime(time: number) {
		if (this.skyboxMat == null) return;

		if (time === 0) {
			this.skyboxMat.emissiveColor = new BABYLON.Color3(0.7, 0.9, 1.0);
		} else if (time === 1) {
			this.skyboxMat.emissiveColor = new BABYLON.Color3(0.8, 0.5, 0.3);
		} else {
			this.skyboxMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.2);
		}

		if (this.sunLight != null) {
			this.sunLight.diffuse = time === 0 ? new BABYLON.Color3(1.0, 0.9, 0.8) : time === 1 ? new BABYLON.Color3(1.0, 0.8, 0.6) : new BABYLON.Color3(0.6, 0.8, 1.0);
			this.sunLight.intensity = time === 0 ? 3 : time === 1 ? 1 : 0.25;
		}
	}

	public updateRoomLightColor(color: BABYLON.Color3): void {
		if (this.roomLight == null) return;
		this.roomLight.diffuse = color;
	}

	public turnOnRoomLight(): void {
		if (this.roomLight == null) return;
		this.roomLight.intensity = 18 * WORLD_SCALE * WORLD_SCALE;
		if (this.envMapIndoor != null) this.envMapIndoor.level = 0.6;
		for (const m of this.engine.scene.materials) {
			if (m.metadata?.disableEnvMap) {
				m.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5);
			}
		}
	}

	public turnOffRoomLight(): void {
		if (this.roomLight == null) return;
		this.roomLight.intensity = 0;
		if (this.envMapIndoor != null) this.envMapIndoor.level = 0.025;
		for (const m of this.engine.scene.materials) {
			if (m.metadata?.disableEnvMap) {
				m.ambientColor = new BABYLON.Color3(0.025, 0.025, 0.025);
			}
		}
	}

	public applyOptions(options: SimpleEnvOptions) {
		// TODO: 返り値をpromiseにしてちゃんとテクスチャが読み終わってからresolveする

		for (const type of ['n', 's', 'w', 'e'] as const) {
			const wallRoot = this.wallRoots[type];
			const wallOptions = options.walls[type];

			for (const mesh of wallRoot.getChildMeshes()) {
				if (mesh.name.includes('__BEAM__')) {
					mesh.setEnabled(wallOptions.withBeam);
				} else if (mesh.name.includes('__BASEBOARD__')) {
					mesh.setEnabled(wallOptions.withBaseboard);
				}
			}

			{
				const targetMaterial = this.wallMaterials[type];

				targetMaterial.unfreeze();
				targetMaterial.albedoColor = new BABYLON.Color3(...wallOptions.color);

				const texPath = wallOptions.material === 'wood' ? '/client-assets/room/textures/wall-wood2.png'
					: wallOptions.material === 'concrete' ? '/client-assets/room/textures/concrete1.png'
					: null;

				if (texPath != null) {
					const tex = new BABYLON.Texture(texPath, this.meshes[0].getScene(), false, false);
					targetMaterial.albedoTexture = tex;
				} else {
					targetMaterial.albedoTexture = null;
				}

				targetMaterial.freeze();
			}

			{
				const targetMaterial = this.wallBeamMaterials[type];

				targetMaterial.unfreeze();
				targetMaterial.albedoColor = new BABYLON.Color3(...wallOptions.beamColor);

				const texPath = wallOptions.beamMaterial === 'wood' ? '/client-assets/room/textures/wall-wood2.png'
					: wallOptions.beamMaterial === 'concrete' ? '/client-assets/room/textures/concrete1.png'
					: null;

				if (texPath != null) {
					const tex = new BABYLON.Texture(texPath, this.meshes[0].getScene(), false, false);
					targetMaterial.albedoTexture = tex;
				} else {
					targetMaterial.albedoTexture = null;
				}

				targetMaterial.freeze();
			}
		}

		for (const type of ['nw', 'ne', 'sw', 'se'] as const) {
			const pillarRoot = this.pillarRoots[type];
			const pillarOptions = options.pillars[type];

			let isEnabled = pillarOptions.show;
			if (!isEnabled) {
				// 梁同士が直交することは許さない(z-fightingが発生する)ので柱を強制追加
				if (type === 'nw') {
					isEnabled = options.walls.n.withBeam && options.walls.w.withBeam;
				} else if (type === 'ne') {
					isEnabled = options.walls.n.withBeam && options.walls.e.withBeam;
				} else if (type === 'sw') {
					isEnabled = options.walls.s.withBeam && options.walls.w.withBeam;
				} else if (type === 'se') {
					isEnabled = options.walls.s.withBeam && options.walls.e.withBeam;
				}
			}
			pillarRoot.setEnabled(isEnabled);

			const targetMaterial = this.pillarMaterials[type];

			targetMaterial.unfreeze();
			targetMaterial.albedoColor = new BABYLON.Color3(...pillarOptions.color);

			const texPath = pillarOptions.material === 'wood' ? '/client-assets/room/textures/wall-wood2.png'
				: pillarOptions.material === 'concrete' ? '/client-assets/room/textures/concrete1.png'
				: null;

			if (texPath != null) {
				const tex = new BABYLON.Texture(texPath, this.meshes[0].getScene(), false, false);
				targetMaterial.albedoTexture = tex;
			} else {
				targetMaterial.albedoTexture = null;
			}

			targetMaterial.freeze();
		}

		{
			this.ceilingMaterial.unfreeze();
			this.ceilingMaterial.albedoColor = new BABYLON.Color3(...options.ceiling.color);

			const texPath = options.ceiling.material === 'wood' ? '/client-assets/room/textures/ceiling-wood.png'
				: options.ceiling.material === 'concrete' ? '/client-assets/room/textures/concrete3.png'
				: null;

			if (texPath != null) {
				const tex = new BABYLON.Texture(texPath, this.meshes[0].getScene(), false, false);
				this.ceilingMaterial.albedoTexture = tex;
			} else {
				this.ceilingMaterial.albedoTexture = null;
			}

			this.ceilingMaterial.freeze();
		}

		{
			this.floorMaterial.unfreeze();
			this.floorMaterial.albedoColor = new BABYLON.Color3(...options.flooring.color);

			const texPath = options.flooring.material === 'wood' ? '/client-assets/room/textures/flooring-wood.png'
				: options.flooring.material === 'concrete' ? '/client-assets/room/textures/concrete3.png'
				: null;

			if (texPath != null) {
				const tex = new BABYLON.Texture(texPath, this.meshes[0].getScene(), false, false);
				this.floorMaterial.albedoTexture = tex;
			} else {
				this.floorMaterial.albedoTexture = null;
			}

			this.floorMaterial.freeze();
		}

		this.onMeshUpdatedCallback?.(this.meshes);
	}

	public dispose() {
		for (const m of this.meshes) {
			m.dispose(false, true);
		}
		for (const m of Object.values(this.wallMaterials ?? {})) {
			m.dispose();
		}
		for (const m of Object.values(this.wallBeamMaterials ?? {})) {
			m.dispose();
		}
		for (const m of Object.values(this.pillarMaterials ?? {})) {
			m.dispose();
		}
		this.skybox?.dispose();
		this.skyboxMat?.dispose();
		this.envMapIndoor?.dispose();
		this.roomLight?.dispose();
		this.sunLight?.dispose();
		if (this.loaderResult != null) {
			for (const m of this.loaderResult.meshes) {
				m.dispose(false, true);
			}
			for (const t of this.loaderResult.transformNodes) {
				t.dispose(false, true);
			}
		}
		super.dispose();
	}
}

export class JapaneseEnvManager extends EnvManager<JapaneseEnvOptions> {
	private loaderResult: BABYLON.ISceneLoaderAsyncResult | null = null;
	private meshes: BABYLON.Mesh[] = [];
	private skybox: BABYLON.Mesh | null = null;
	private skyboxMat: BABYLON.StandardMaterial | null = null;
	private roomLight: BABYLON.SpotLight | null = null;
	private sunLight: BABYLON.DirectionalLight | null = null;
	public envMapIndoor: BABYLON.CubeTexture | null = null;
	public maxCameraZ = cm(1000);

	constructor(engine: RoomEngine, onMeshUpdatedCallback?: ((meshes: BABYLON.AbstractMesh[]) => void) | null) {
		super(engine, onMeshUpdatedCallback);
	}

	public async load(options: JapaneseEnvOptions) {
		this.skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: cm(1000) }, this.engine.scene);
		this.skyboxMat = new BABYLON.StandardMaterial('skyboxMat', this.engine.scene);
		this.skyboxMat.backFaceCulling = false;
		this.skyboxMat.disableLighting = true;
		this.skybox.material = this.skyboxMat;
		this.skybox.infiniteDistance = true;

		this.roomLight = new BABYLON.SpotLight('simpleEnv:RoomLight', new BABYLON.Vector3(0, cm(249), 0), new BABYLON.Vector3(0, -1, 0), 16, 8, this.engine.scene);
		this.roomLight.diffuse = new BABYLON.Color3(...this.engine.roomState.roomLightColor);
		this.roomLight.shadowMinZ = cm(10);
		this.roomLight.shadowMaxZ = cm(300);
		this.roomLight.radius = cm(30);

		if (this.engine.graphicsQuality >= GRAPHICS_QUALITY.MEDIUM) {
			const shadowGeneratorForRoomLight = new BABYLON.ShadowGenerator(this.engine.graphicsQuality <= GRAPHICS_QUALITY.MEDIUM ? 1024 : 2048, this.roomLight);
			shadowGeneratorForRoomLight.forceBackFacesOnly = true;
			shadowGeneratorForRoomLight.bias = 0.0005;
			shadowGeneratorForRoomLight.usePercentageCloserFiltering = true;
			shadowGeneratorForRoomLight.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
			if (this.engine.graphicsQuality <= GRAPHICS_QUALITY.MEDIUM) {
				shadowGeneratorForRoomLight.getShadowMap().refreshRate = 60;
			}
			//shadowGeneratorForRoomLight.useContactHardeningShadow = true;
			//shadowGeneratorForRoomLight.contactHardeningLightSizeUVRatio = 0.01;
			this.shadowGenerators.push(shadowGeneratorForRoomLight);
		}

		if (this.engine.graphicsQuality >= GRAPHICS_QUALITY.MEDIUM) {
			this.sunLight = new BABYLON.DirectionalLight('simpleEnv:SunLight', new BABYLON.Vector3(0.2, -1, -1), this.engine.scene);
			this.sunLight.position = new BABYLON.Vector3(cm(-20), cm(1000), cm(1000));
			this.sunLight.shadowMinZ = cm(1000);
			this.sunLight.shadowMaxZ = cm(2000);

			const shadowGeneratorForSunLight = new BABYLON.ShadowGenerator(this.engine.graphicsQuality <= GRAPHICS_QUALITY.MEDIUM ? 1024 : 2048, this.sunLight);
			shadowGeneratorForSunLight.forceBackFacesOnly = true;
			shadowGeneratorForSunLight.bias = 0.00001;
			shadowGeneratorForSunLight.usePercentageCloserFiltering = true;
			shadowGeneratorForSunLight.usePoissonSampling = true;
			if (this.engine.graphicsQuality <= GRAPHICS_QUALITY.MEDIUM) {
				shadowGeneratorForSunLight.getShadowMap().refreshRate = 60;
			}
			this.shadowGenerators.push(shadowGeneratorForSunLight);
		}

		this.loaderResult = await BABYLON.ImportMeshAsync('/client-assets/room/envs/japanese/japanese.glb', this.engine.scene);

		this.envMapIndoor = BABYLON.CubeTexture.CreateFromPrefilteredData('/client-assets/room/indoor.env', this.engine.scene);
		this.envMapIndoor.boundingBoxSize = new BABYLON.Vector3(cm(500), cm(500), cm(500));

		this.meshes = this.loaderResult.meshes.filter(m => m instanceof BABYLON.Mesh);
		this.meshes[0].scaling = this.meshes[0].scaling.scale(WORLD_SCALE);
		this.meshes[0].rotationQuaternion = null;
		this.meshes[0].rotation = new BABYLON.Vector3(0, 0, 0);

		// instanced mesh を通常の mesh に変換 (そうしないとマテリアルが共有される)
		for (const mesh of this.loaderResult.meshes) {
			if (mesh instanceof BABYLON.InstancedMesh) {
				const realizedMesh = mesh.sourceMesh.clone(mesh.name, null, true);

				realizedMesh.position = mesh.position.clone();
				if (mesh.rotationQuaternion) {
					realizedMesh.rotationQuaternion = mesh.rotationQuaternion.clone();
				} else {
					realizedMesh.rotation = mesh.rotation.clone();
				}
				realizedMesh.scaling = mesh.scaling.clone();
				realizedMesh.parent = mesh.parent;

				mesh.dispose();
				this.engine.scene.removeMesh(mesh);
				this.meshes.push(realizedMesh);
			}
		}

		for (const mesh of this.meshes) {
			if (SYSTEM_HEYA_MESH_NAMES.some(name => mesh.name.includes(name))) continue;
			mesh.receiveShadows = true;

			this.addShadowCaster(mesh);

			const mat = mesh.material;
			if (mat instanceof BABYLON.MultiMaterial) {
				for (const subMat of mat.subMaterials) {
					subMat.reflectionTexture = this.envMapIndoor;
				}
			} else if (mat instanceof BABYLON.PBRMaterial) {
				mat.reflectionTexture = this.envMapIndoor;
			}
		}

		await this.applyOptions(options);
	}

	public setTime(time: number) {
		if (this.skyboxMat == null) return;

		if (time === 0) {
			this.skyboxMat.emissiveColor = new BABYLON.Color3(0.7, 0.9, 1.0);
		} else if (time === 1) {
			this.skyboxMat.emissiveColor = new BABYLON.Color3(0.8, 0.5, 0.3);
		} else {
			this.skyboxMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.2);
		}

		if (this.sunLight != null) {
			this.sunLight.diffuse = time === 0 ? new BABYLON.Color3(1.0, 0.9, 0.8) : time === 1 ? new BABYLON.Color3(1.0, 0.8, 0.6) : new BABYLON.Color3(0.6, 0.8, 1.0);
			this.sunLight.intensity = time === 0 ? 3 : time === 1 ? 1 : 0.25;
		}
	}

	public updateRoomLightColor(color: BABYLON.Color3): void {
		if (this.roomLight == null) return;
		this.roomLight.diffuse = color;
	}

	public turnOnRoomLight(): void {
		if (this.roomLight == null) return;
		this.roomLight.intensity = 18 * WORLD_SCALE * WORLD_SCALE;
		if (this.envMapIndoor != null) this.envMapIndoor.level = 0.6;
		for (const m of this.engine.scene.materials) {
			if (m.metadata?.disableEnvMap) {
				m.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5);
			}
		}
	}

	public turnOffRoomLight(): void {
		if (this.roomLight == null) return;
		this.roomLight.intensity = 0;
		if (this.envMapIndoor != null) this.envMapIndoor.level = 0.025;
		for (const m of this.engine.scene.materials) {
			if (m.metadata?.disableEnvMap) {
				m.ambientColor = new BABYLON.Color3(0.025, 0.025, 0.025);
			}
		}
	}

	public applyOptions(options: SimpleEnvOptions) {
		this.onMeshUpdatedCallback?.(this.meshes);
	}

	public dispose() {
		for (const m of this.meshes) {
			m.dispose(false, true);
		}
		this.skybox?.dispose();
		this.skyboxMat?.dispose();
		this.envMapIndoor?.dispose();
		this.roomLight?.dispose();
		this.sunLight?.dispose();
		if (this.loaderResult != null) {
			for (const m of this.loaderResult.meshes) {
				m.dispose(false, true);
			}
			for (const t of this.loaderResult.transformNodes) {
				t.dispose(false, true);
			}
		}
		super.dispose();
	}
}

export class MuseumEnvManager extends EnvManager<MuseumEnvOptions> {
	private loaderResult: BABYLON.ISceneLoaderAsyncResult | null = null;
	private meshes: BABYLON.Mesh[] = [];
	private roomLight: BABYLON.DirectionalLight | null = null;
	private subRoomLights: BABYLON.SpotLight[] = [];
	public envMapIndoor: BABYLON.CubeTexture | null = null;
	public maxCameraZ = cm(3000);

	constructor(engine: RoomEngine, onMeshUpdatedCallback?: ((meshes: BABYLON.AbstractMesh[]) => void) | null) {
		super(engine, onMeshUpdatedCallback);
	}

	public async load(options: MuseumEnvOptions) {
		this.loaderResult = await BABYLON.ImportMeshAsync('/client-assets/room/envs/museum/museum.glb', this.engine.scene);

		this.envMapIndoor = BABYLON.CubeTexture.CreateFromPrefilteredData('/client-assets/room/indoor.env', this.engine.scene);
		this.envMapIndoor.boundingBoxSize = new BABYLON.Vector3(cm(2000), cm(500), cm(2000));

		this.meshes = this.loaderResult.meshes.filter(m => m instanceof BABYLON.Mesh);
		this.meshes[0].scaling = this.meshes[0].scaling.scale(WORLD_SCALE);
		this.meshes[0].rotationQuaternion = null;
		this.meshes[0].rotation = new BABYLON.Vector3(0, 0, 0);

		// instanced mesh を通常の mesh に変換 (そうしないとマテリアルが共有される)
		for (const mesh of this.loaderResult.meshes) {
			if (mesh instanceof BABYLON.InstancedMesh) {
				const realizedMesh = mesh.sourceMesh.clone(mesh.name, null, true);

				realizedMesh.position = mesh.position.clone();
				if (mesh.rotationQuaternion) {
					realizedMesh.rotationQuaternion = mesh.rotationQuaternion.clone();
				} else {
					realizedMesh.rotation = mesh.rotation.clone();
				}
				realizedMesh.scaling = mesh.scaling.clone();
				realizedMesh.parent = mesh.parent;

				mesh.dispose();
				this.engine.scene.removeMesh(mesh);
				this.meshes.push(realizedMesh);
			}
		}

		this.roomLight = new BABYLON.DirectionalLight('museumEnv:RoomLight', new BABYLON.Vector3(0, -1, 0), this.engine.scene);
		this.roomLight.position = new BABYLON.Vector3(0, cm(300), 0);
		this.roomLight.diffuse = new BABYLON.Color3(...this.engine.roomState.roomLightColor);
		this.roomLight.shadowMinZ = cm(10);
		this.roomLight.shadowMaxZ = cm(500);
		this.roomLight.radius = cm(30);

		if (this.engine.graphicsQuality >= GRAPHICS_QUALITY.MEDIUM) {
			const shadowGeneratorForRoomLight = new BABYLON.ShadowGenerator(this.engine.graphicsQuality <= GRAPHICS_QUALITY.MEDIUM ? 1024 : 2048, this.roomLight);
			shadowGeneratorForRoomLight.forceBackFacesOnly = true;
			shadowGeneratorForRoomLight.bias = 0.00001;
			shadowGeneratorForRoomLight.normalBias = 0.005;
			shadowGeneratorForRoomLight.usePercentageCloserFiltering = true;
			shadowGeneratorForRoomLight.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
			if (this.engine.graphicsQuality <= GRAPHICS_QUALITY.MEDIUM) {
				shadowGeneratorForRoomLight.getShadowMap().refreshRate = 60;
			}
			//this.shadowGeneratorForRoomLight.useContactHardeningShadow = true;
			this.shadowGenerators.push(shadowGeneratorForRoomLight);
		}

		for (const node of this.meshes.filter(mesh => mesh.name.includes('__LIGHT__'))) {
			const light = new BABYLON.SpotLight('museumEnv:SubRoomLight', node.position, new BABYLON.Vector3(0, -1, 0), 16, 8, this.engine.scene, true);
			light.diffuse = new BABYLON.Color3(...this.engine.roomState.roomLightColor);
			light.range = cm(500);
			light.radius = cm(15);
			light.parent = this.meshes[0];
			this.engine.lightContainer.addLight(light);
			this.subRoomLights.push(light);
		}

		for (const mesh of this.meshes) {
			if (SYSTEM_HEYA_MESH_NAMES.some(name => mesh.name.includes(name))) continue;
			mesh.receiveShadows = true;
			//this.addShadowCaster(mesh);

			const mat = mesh.material;
			if (mat instanceof BABYLON.MultiMaterial) {
				for (const subMat of mat.subMaterials) {
					subMat.reflectionTexture = this.envMapIndoor;
				}
			} else if (mat instanceof BABYLON.PBRMaterial) {
				mat.reflectionTexture = this.envMapIndoor;
			}
		}

		await this.applyOptions(options);
	}

	public setTime(time: number) {
	}

	public updateRoomLightColor(color: BABYLON.Color3): void {
		if (this.roomLight == null) return;
		this.roomLight.diffuse = color;
		for (const subLight of this.subRoomLights) {
			subLight.diffuse = color;
		}
	}

	public turnOnRoomLight(): void {
		if (this.roomLight == null) return;
		this.roomLight.intensity = 0.00005 * WORLD_SCALE * WORLD_SCALE;
		for (const subLight of this.subRoomLights) {
			subLight.intensity = 20 * WORLD_SCALE * WORLD_SCALE;
		}
		if (this.envMapIndoor != null) this.envMapIndoor.level = 0.2;
		for (const m of this.engine.scene.materials) {
			if (m.metadata?.disableEnvMap) {
				m.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5);
			}
		}
	}

	public turnOffRoomLight(): void {
		if (this.roomLight == null) return;
		this.roomLight.intensity = 0;
		for (const subLight of this.subRoomLights) {
			subLight.intensity = 0;
		}
		if (this.envMapIndoor != null) this.envMapIndoor.level = 0.025;
		for (const m of this.engine.scene.materials) {
			if (m.metadata?.disableEnvMap) {
				m.ambientColor = new BABYLON.Color3(0.025, 0.025, 0.025);
			}
		}
	}

	public applyOptions(options: MuseumEnvOptions) {
		this.onMeshUpdatedCallback?.(this.meshes);
	}

	public dispose() {
		this.envMapIndoor?.dispose();
		this.roomLight?.dispose();
		for (const subLight of this.subRoomLights) {
			subLight.dispose();
		}
		if (this.loaderResult != null) {
			for (const m of this.loaderResult.meshes) {
				m.dispose(false, true);
			}
			for (const t of this.loaderResult.transformNodes) {
				t.dispose(false, true);
			}
		}
		for (const m of this.meshes) {
			m.dispose(false, true);
		}
		super.dispose();
	}
}
