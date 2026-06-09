/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { cm, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { findMaterial, GRAPHICS_QUALITY, treeClone } from '../../utility.js';
import { SYSTEM_HEYA_MESH_NAMES } from '../utility.js';
import { EnvManager } from '../env.js';
import type { RoomEngine } from '../engine.js';
import type { SimpleEnvOptions } from 'misskey-world/src/room/env.js';

// TODO: マテリアルは必要になるまで作成しないようにする

export class SimpleEnvManager extends EnvManager<SimpleEnvOptions> {
	private loaderResult: BABYLON.ISceneLoaderAsyncResult | null = null;
	private rootNode: BABYLON.TransformNode;
	private wallRoots: Record<'zPositive' | 'zNegative' | 'xPositive' | 'xNegative', BABYLON.TransformNode>;
	private wallScalingContainers: Record<'zPositive' | 'zNegative' | 'xPositive' | 'xNegative', BABYLON.TransformNode>;
	private wallMaterials: Record<'zPositive' | 'zNegative' | 'xPositive' | 'xNegative', BABYLON.PBRMaterial>;
	private wallBeamMaterials: Record<'zPositive' | 'zNegative' | 'xPositive' | 'xNegative', BABYLON.PBRMaterial>;
	private pillarRoots: Record<'zp_xp' | 'zp_xn' | 'zn_xp' | 'zn_xn', BABYLON.TransformNode>;
	private pillarMaterials: Record<'zp_xp' | 'zp_xn' | 'zn_xp' | 'zn_xn', BABYLON.PBRMaterial>;
	private ceilingMaterial: BABYLON.PBRMaterial;
	private floorMaterial: BABYLON.PBRMaterial;
	private skybox: BABYLON.Mesh | null = null;
	private skyboxMat: BABYLON.StandardMaterial | null = null;
	private roomLight: BABYLON.SpotLight | null = null;
	private sunLight: BABYLON.DirectionalLight | null = null;
	public envMapIndoor: BABYLON.CubeTexture | null = null;
	public maxCameraZ = cm(1000);

	constructor(engine: RoomEngine) {
		super(engine);

		this.rootNode = new BABYLON.TransformNode('simpleEnvRoot', this.engine.scene);

		this.wallRoots = {
			zPositive: new BABYLON.TransformNode('wallRootZPositive', this.engine.scene),
			zNegative: new BABYLON.TransformNode('wallRootZNegative', this.engine.scene),
			xPositive: new BABYLON.TransformNode('wallRootXPositive', this.engine.scene),
			xNegative: new BABYLON.TransformNode('wallRootXNegative', this.engine.scene),
		};
		this.wallRoots.zPositive.parent = this.rootNode;
		this.wallRoots.zPositive.position.z = cm(150);
		this.wallRoots.zPositive.rotation.y = Math.PI;
		this.wallRoots.zNegative.parent = this.rootNode;
		this.wallRoots.zNegative.position.z = -cm(150);
		this.wallRoots.xPositive.parent = this.rootNode;
		this.wallRoots.xPositive.position.x = cm(150);
		this.wallRoots.xPositive.rotation.y = -Math.PI / 2;
		this.wallRoots.xNegative.parent = this.rootNode;
		this.wallRoots.xNegative.position.x = -cm(150);
		this.wallRoots.xNegative.rotation.y = Math.PI / 2;

		this.wallScalingContainers = {
			zPositive: new BABYLON.TransformNode('wallScalingContainerZPositive', this.engine.scene),
			zNegative: new BABYLON.TransformNode('wallScalingContainerZNegative', this.engine.scene),
			xPositive: new BABYLON.TransformNode('wallScalingContainerXPositive', this.engine.scene),
			xNegative: new BABYLON.TransformNode('wallScalingContainerXNegative', this.engine.scene),
		};
		for (const [k, v] of Object.entries(this.wallScalingContainers)) {
			v.parent = this.wallRoots[k as keyof typeof this.wallRoots];
			v.scaling = new BABYLON.Vector3(-WORLD_SCALE, WORLD_SCALE, WORLD_SCALE);
		}

		this.pillarRoots = {
			zp_xp: new BABYLON.TransformNode('pillarRootZpXp', this.engine.scene),
			zp_xn: new BABYLON.TransformNode('pillarRootZpXn', this.engine.scene),
			zn_xp: new BABYLON.TransformNode('pillarRootZnXp', this.engine.scene),
			zn_xn: new BABYLON.TransformNode('pillarRootZnXn', this.engine.scene),
		};
		for (const v of Object.values(this.pillarRoots)) {
			v.parent = this.rootNode;
		}

		const wallMaterial = new BABYLON.PBRMaterial('wallMaterial', this.engine.scene);
		wallMaterial.albedoColor = new BABYLON.Color3(0.8, 0.8, 0.8);
		wallMaterial.roughness = 1;
		wallMaterial.metallic = 0;
		this.wallMaterials = {
			zPositive: wallMaterial.clone('wallZPositiveMaterial'),
			zNegative: wallMaterial.clone('wallZNegativeMaterial'),
			xPositive: wallMaterial.clone('wallXPositiveMaterial'),
			xNegative: wallMaterial.clone('wallXNegativeMaterial'),
		};

		const beamMaterial = wallMaterial.clone('beamMaterial');
		this.wallBeamMaterials = {
			zPositive: beamMaterial.clone('beamZPositiveMaterial'),
			zNegative: beamMaterial.clone('beamZNegativeMaterial'),
			xPositive: beamMaterial.clone('beamXPositiveMaterial'),
			xNegative: beamMaterial.clone('beamXNegativeMaterial'),
		};

		const pillarMaterial = wallMaterial.clone('pillarMaterial');
		this.pillarMaterials = {
			zp_xp: pillarMaterial.clone('pillarMaterialZpXp'),
			zp_xn: pillarMaterial.clone('pillarMaterialZpXn'),
			zn_xp: pillarMaterial.clone('pillarMaterialZnXp'),
			zn_xn: pillarMaterial.clone('pillarMaterialZnXn'),
		};

		this.ceilingMaterial = new BABYLON.PBRMaterial('ceilingMaterial', this.engine.scene);
		this.ceilingMaterial.albedoColor = new BABYLON.Color3(0.8, 0.8, 0.8);
		this.ceilingMaterial.roughness = 1;
		this.ceilingMaterial.metallic = 0;
		this.floorMaterial = new BABYLON.PBRMaterial('floorMaterial', this.engine.scene);
		this.floorMaterial.albedoColor = new BABYLON.Color3(0.8, 0.8, 0.8);
		this.floorMaterial.roughness = 1;
		this.floorMaterial.metallic = 0;

		const baseboardMaterial = new BABYLON.PBRMaterial('baseboardMaterial', this.engine.scene);
		baseboardMaterial.albedoColor = new BABYLON.Color3(0.8, 0.8, 0.8);
		baseboardMaterial.roughness = 1;
		baseboardMaterial.metallic = 0;

		this.skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: cm(1000) }, this.engine.scene);
		this.skyboxMat = new BABYLON.StandardMaterial('skyboxMat', this.engine.scene);
		this.skyboxMat.backFaceCulling = false;
		this.skyboxMat.disableLighting = true;
		this.skybox.material = this.skyboxMat;
		this.skybox.infiniteDistance = true;

		this.roomLight = new BABYLON.SpotLight('env:RoomLight', new BABYLON.Vector3(0, cm(249), 0), new BABYLON.Vector3(0, -1, 0), 16, 8, this.engine.scene);
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
			this.sunLight = new BABYLON.DirectionalLight('env:SunLight', new BABYLON.Vector3(0.2, -1, -1), this.engine.scene);
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

		this.envMapIndoor = BABYLON.CubeTexture.CreateFromPrefilteredData('/client-assets/room/indoor.env', this.engine.scene);
		this.envMapIndoor.boundingBoxSize = new BABYLON.Vector3(cm(500), cm(500), cm(500));
	}

	public async load(options: SimpleEnvOptions) {
		this.loaderResult = await BABYLON.LoadAssetContainerAsync('/client-assets/room/envs/simple/300.glb', this.engine.scene);

		const collisionScalingContainer = new BABYLON.TransformNode('collisionScalingContainer', this.engine.scene);
		collisionScalingContainer.scaling = new BABYLON.Vector3(-WORLD_SCALE, WORLD_SCALE, WORLD_SCALE);
		collisionScalingContainer.parent = this.rootNode;
		const collision = this.loaderResult.meshes.find(m => m.name.includes('__COLLISION__'))!;
		collision.parent = collisionScalingContainer;

		const lightBlockerScalingContainer = new BABYLON.TransformNode('lightBlockerScalingContainer', this.engine.scene);
		lightBlockerScalingContainer.scaling = new BABYLON.Vector3(-WORLD_SCALE, WORLD_SCALE, WORLD_SCALE);
		lightBlockerScalingContainer.parent = this.rootNode;
		const lightBlocker = this.loaderResult.meshes.find(m => m.name.includes('__LIGHT_BLOCKER__'))!;
		lightBlocker.parent = lightBlockerScalingContainer;
		lightBlocker.rotationQuaternion = null;
		lightBlocker.rotation.y = Math.PI;

		const originalFloorRoot = this.loaderResult.transformNodes.find(t => t.name.includes('__FLOOR__'))!;
		originalFloorRoot.scaling = new BABYLON.Vector3(-WORLD_SCALE, WORLD_SCALE, WORLD_SCALE);
		originalFloorRoot.parent = this.rootNode;
		for (const child of originalFloorRoot.getChildMeshes()) {
			if (child.material.name.includes('__FLOOR__')) {
				child.material = this.floorMaterial;
			}
		}

		const originalCeilingRoot = this.loaderResult.transformNodes.find(t => t.name.includes('__CEILING__'))!;
		originalCeilingRoot.scaling = new BABYLON.Vector3(-WORLD_SCALE, WORLD_SCALE, WORLD_SCALE);
		originalCeilingRoot.position.y = cm(250);
		originalCeilingRoot.parent = this.rootNode;
		for (const child of originalCeilingRoot.getChildMeshes()) {
			if (child.material.name.includes('__CEILING__')) {
				child.material = this.ceilingMaterial;
			}
		}

		await this.applyOptions(options);
	}

	public applyOptions(options: SimpleEnvOptions) {
		// clean up
		for (const type of ['zPositive', 'zNegative', 'xPositive', 'xNegative'] as const) {
			const wallRoot = this.wallScalingContainers[type];
			for (const mesh of wallRoot.getChildMeshes()) {
				mesh.dispose();
				this.engine.scene.removeMesh(mesh);
				this.removeShadowCaster(mesh);
			}
		}

		// TODO: 返り値をpromiseにしてちゃんとテクスチャが読み終わってからresolveする

		for (const type of ['zPositive', 'zNegative', 'xPositive', 'xNegative'] as const) {
			const wallRoot = this.wallScalingContainers[type];
			const wallOptions = options.walls[type];

			const originalRoot =
				type === 'zPositive' ?
					options.window === 'kosidakamado' ? this.loaderResult!.transformNodes.find(t => t.name.includes('__WALL_KOSIDAKAMADO__'))! :
					options.window === 'demado' ? this.loaderResult!.transformNodes.find(t => t.name.includes('__WALL_DEMADO__'))! :
					this.loaderResult!.transformNodes.find(t => t.name.includes('__WALL__'))!
					: type === 'zNegative'
						? this.loaderResult!.transformNodes.find(t => t.name.includes('__WALL_DOOR__'))!
						: this.loaderResult!.transformNodes.find(t => t.name.includes('__WALL__'))!;

			for (const child of treeClone(originalRoot).getChildren()) {
				child.parent = wallRoot;
			}

			for (const child of wallRoot.getChildMeshes()) {
				if (child.material.name.includes('__WALL__')) {
					child.material = this.wallMaterials[type];
				} else if (child.material.name.includes('__BEAM__')) {
					child.material = this.wallBeamMaterials[type];
				}
			}

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
					const tex = new BABYLON.Texture(texPath, this.engine.scene, false, false);
					tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
					tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
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
					const tex = new BABYLON.Texture(texPath, this.engine.scene, false, false);
					targetMaterial.albedoTexture = tex;
				} else {
					targetMaterial.albedoTexture = null;
				}

				targetMaterial.freeze();
			}
		}

		for (const type of ['zp_xp', 'zp_xn', 'zn_xp', 'zn_xn'] as const) {
			const pillarRoot = this.pillarRoots[type];
			const pillarOptions = options.pillars[type];

			let isEnabled = pillarOptions.show;
			if (!isEnabled) {
				// 梁同士が直交することは許さない(z-fightingが発生する)ので柱を強制追加
				if (type === 'zp_xp') {
					isEnabled = options.walls.zPositive.withBeam && options.walls.xPositive.withBeam;
				} else if (type === 'zp_xn') {
					isEnabled = options.walls.zPositive.withBeam && options.walls.xNegative.withBeam;
				} else if (type === 'zn_xp') {
					isEnabled = options.walls.zNegative.withBeam && options.walls.xPositive.withBeam;
				} else if (type === 'zn_xn') {
					isEnabled = options.walls.zNegative.withBeam && options.walls.xNegative.withBeam;
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
				const tex = new BABYLON.Texture(texPath, this.engine.scene, false, false);
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
				const tex = new BABYLON.Texture(texPath, this.engine.scene, false, false);
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
				const tex = new BABYLON.Texture(texPath, this.engine.scene, false, false);
				this.floorMaterial.albedoTexture = tex;
			} else {
				this.floorMaterial.albedoTexture = null;
			}

			this.floorMaterial.freeze();
		}

		for (const mesh of this.rootNode.getChildMeshes()) {
			if (SYSTEM_HEYA_MESH_NAMES.some(name => mesh.name.includes(name))) continue;
			mesh.receiveShadows = true;
			//if (mesh.material !== this.floorMaterial) { // 床は他の何にも影を落とさないことが確定している
			this.addShadowCaster(mesh);
			//}
		}
		this.registerMeshes(this.rootNode.getChildMeshes());
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

	public dispose() {
		for (const m of this.rootNode.getChildMeshes()) {
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

