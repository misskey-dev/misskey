/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { cm, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { findMaterial, GRAPHICS_QUALITY } from '../../utility.js';
import { SYSTEM_HEYA_MESH_NAMES } from '../utility.js';
import { EnvManager } from '../env.js';
import type { RoomEngine } from '../engine.js';
import type { CustomMadoriEnvOptions } from 'misskey-world/src/room/env.js';

export class CustomMadoriEnvManager extends EnvManager<CustomMadoriEnvOptions> {
	private loaderResult: BABYLON.ISceneLoaderAsyncResult | null = null;
	private meshes: BABYLON.Mesh[] = [];
	private rootNode: BABYLON.TransformNode;
	private unitRootNodes: (BABYLON.TransformNode | null)[] = [];
	private floorRootNode: BABYLON.TransformNode | null = null;
	private wallRootNode: BABYLON.TransformNode | null = null;
	private floorMaterials: Record<string, BABYLON.PBRMaterial> = {};
	private wallMaterials: Record<string, BABYLON.PBRMaterial> = {};
	private wallBeamMaterials: Record<string, BABYLON.PBRMaterial> = {};
	private pillarMaterials: Record<string, BABYLON.PBRMaterial> = {};
	private ceilingMaterials: Record<string, BABYLON.PBRMaterial> = {};
	private beamMesh: BABYLON.Mesh | null = null;
	private baseboardMesh: BABYLON.Mesh | null = null;
	private wallARootNode: BABYLON.TransformNode | null = null;
	private wallBRootNode: BABYLON.TransformNode | null = null;
	private skybox: BABYLON.Mesh | null = null;
	private skyboxMat: BABYLON.StandardMaterial | null = null;
	private roomLight: BABYLON.DirectionalLight | null = null;
	public envMapIndoor: BABYLON.CubeTexture | null = null;
	public maxCameraZ = cm(3000);

	constructor(engine: RoomEngine) {
		super(engine);

		this.rootNode = new BABYLON.TransformNode('customMadoriRoot', this.engine.scene);
		//this.rootNode.scaling = new BABYLON.Vector3(WORLD_SCALE, WORLD_SCALE, WORLD_SCALE);
	}

	public async load(options: CustomMadoriEnvOptions) {
		this.skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: cm(3000) }, this.engine.scene);
		this.skyboxMat = new BABYLON.StandardMaterial('skyboxMat', this.engine.scene);
		this.skyboxMat.backFaceCulling = false;
		this.skyboxMat.disableLighting = true;
		this.skybox.material = this.skyboxMat;
		this.skybox.infiniteDistance = true;

		this.roomLight = new BABYLON.DirectionalLight('env:RoomLight', new BABYLON.Vector3(0, -1, 0), this.engine.scene);
		this.roomLight.position = new BABYLON.Vector3(0, cm(300), 0);
		this.roomLight.diffuse = new BABYLON.Color3(...this.engine.roomState.roomLightColor);
		this.roomLight.shadowMinZ = cm(10);
		this.roomLight.shadowMaxZ = cm(500);
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

		for (const materialDef of options.flooringMaterials) {
			const mat = new BABYLON.PBRMaterial(`flooring_${materialDef.id}`, this.engine.scene);
			mat.albedoColor = new BABYLON.Color3(...materialDef.color);
			mat.metallic = 0;
			mat.roughness = 1;

			const texPath = materialDef.texture === 'wood' ? '/client-assets/room/textures/flooring-wood.png'
				: materialDef.texture === 'concrete' ? '/client-assets/room/textures/concrete3.png'
				: null;

			if (texPath != null) {
				const tex = new BABYLON.Texture(texPath, this.engine.scene, false, false);
				mat.albedoTexture = tex;
			}

			//mat.freeze();
			this.floorMaterials[materialDef.id] = mat;
		}

		for (const materialDef of options.wallMaterials) {
			const mat = new BABYLON.PBRMaterial(`wall_${materialDef.id}`, this.engine.scene);
			mat.albedoColor = new BABYLON.Color3(...materialDef.color);
			mat.metallic = 0;
			mat.roughness = 1;

			const texPath = materialDef.texture === 'wood' ? '/client-assets/room/textures/wall-wood2.png'
				: materialDef.texture === 'concrete' ? '/client-assets/room/textures/concrete1.png'
				: null;

			if (texPath != null) {
				const tex = new BABYLON.Texture(texPath, this.engine.scene, false, false);
				mat.albedoTexture = tex;
			}

			//mat.freeze();
			this.wallMaterials[materialDef.id] = mat;
		}

		for (const materialDef of options.ceilingMaterials) {
			const mat = new BABYLON.PBRMaterial(`ceiling_${materialDef.id}`, this.engine.scene);
			mat.albedoColor = new BABYLON.Color3(...materialDef.color);
			mat.metallic = 0;
			mat.roughness = 1;

			const texPath = materialDef.texture === 'wood' ? '/client-assets/room/textures/ceiling-wood.png'
				: materialDef.texture === 'concrete' ? '/client-assets/room/textures/concrete3.png'
				: null;

			if (texPath != null) {
				const tex = new BABYLON.Texture(texPath, this.engine.scene, false, false);
				mat.albedoTexture = tex;
			}

			//mat.freeze();
			this.ceilingMaterials[materialDef.id] = mat;
		}

		this.loaderResult = await BABYLON.LoadAssetContainerAsync('/client-assets/room/envs/custom-madori/units.glb', this.engine.scene);

		this.envMapIndoor = BABYLON.CubeTexture.CreateFromPrefilteredData('/client-assets/room/indoor.env', this.engine.scene);
		this.envMapIndoor.boundingBoxSize = new BABYLON.Vector3(cm(2000), cm(500), cm(2000));

		this.meshes = this.loaderResult.meshes.filter(m => m instanceof BABYLON.Mesh);
		this.meshes[0].rotationQuaternion = null;
		this.meshes[0].rotation = new BABYLON.Vector3(0, 0, 0);

		for (const m of this.meshes[0].getChildren()) {
			if (m.parent === this.meshes[0]) {
				m.parent = this.rootNode;
			}
		}

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

		this.floorRootNode = this.loaderResult.transformNodes.find(t => t.name.includes('__FLOOR__'))!;
		this.wallRootNode = this.loaderResult.transformNodes.find(t => t.name.includes('__WALL__'))!;
		this.beamMesh = this.loaderResult.meshes.find(m => m.name.includes('__BEAM__')) as BABYLON.Mesh;
		this.baseboardMesh = this.loaderResult.meshes.find(m => m.name.includes('__BASEBOARD__')) as BABYLON.Mesh;
		this.wallARootNode = this.loaderResult.transformNodes.find(t => t.name.includes('__WALL_A__'))!;
		this.wallBRootNode = this.loaderResult.transformNodes.find(t => t.name.includes('__WALL_B__'))!;

		const baseboardMaterial = findMaterial(this.rootNode, '__BASEBOARD__');
		//baseboardMaterial.metadata.disableEnvMap = true;

		for (const mesh of this.meshes) {
			if (SYSTEM_HEYA_MESH_NAMES.some(name => mesh.name.includes(name))) continue;
			mesh.receiveShadows = true;
		}

		await this.applyOptions(options);
	}

	private createUnit(options: CustomMadoriEnvOptions, x: number, z: number) {
		function indexToPos(index: number): [number, number] {
			const z = Math.floor(index / options.dimension[0]);
			const x = index % options.dimension[0];
			return [x, z];
		}

		function posToIndex(x: number, z: number): number {
			if (x < 0 || z < 0 || x >= options.dimension[0] || z >= options.dimension[1]) return -1;
			return x + (options.dimension[0] * z);
		}

		const unitDef = options.units[posToIndex(x, z)];
		if (unitDef == null) return;

		const unitNDef = options.units[posToIndex(x, z + 1)];
		const unitSDef = options.units[posToIndex(x, z - 1)];
		const unitWDef = options.units[posToIndex(x + 1, z)];
		const unitEDef = options.units[posToIndex(x - 1, z)];

		const shiftedX = x - (options.dimension[0] / 2) + 0.5;

		const unitRoot = new BABYLON.TransformNode(`unit_${x}_${z}`, this.engine.scene);
		unitRoot.parent = this.rootNode;
		unitRoot.position = new BABYLON.Vector3(cm(100) * shiftedX, 0, cm(100) * z);

		const defaultFlooringMaterial = this.floorMaterials[options.flooringMaterials[0].id];
		const unitFloorRootNode = this.floorRootNode.clone(`unit_${x}_${z}_floor`, unitRoot)!;
		unitFloorRootNode.scaling = new BABYLON.Vector3(-WORLD_SCALE, WORLD_SCALE, WORLD_SCALE);
		const flooringMesh = unitFloorRootNode.getChildMeshes().find(m => m.name.includes('__FLOOR__'));
		flooringMesh.material = unitDef.flooring?.material != null && this.floorMaterials[unitDef.flooring.material] != null ? this.floorMaterials[unitDef.flooring.material] : defaultFlooringMaterial;
		const defaultCeilingMaterial = this.ceilingMaterials[options.ceilingMaterials[0].id];
		const ceilingMesh = unitFloorRootNode.getChildMeshes().find(m => m.name.includes('__CEILING__'));
		ceilingMesh.material = unitDef.ceiling?.material != null && this.ceilingMaterials[unitDef.ceiling.material] != null ? this.ceilingMaterials[unitDef.ceiling.material] : defaultCeilingMaterial;
		const defaultWallMaterial = this.wallMaterials[options.wallMaterials[0].id];

		const createWall = (dir: 'n' | 's' | 'w' | 'e') => {
			const wallDef = unitDef.walls?.[dir] ?? {};
			const wallRootNode = this.wallRootNode.clone(`unit_${x}_${z}_wall_${dir}`, unitRoot)!;
			wallRootNode.scaling = new BABYLON.Vector3(-WORLD_SCALE, WORLD_SCALE, WORLD_SCALE);

			switch (dir) {
				case 'n':
					wallRootNode.rotation = new BABYLON.Vector3(0, Math.PI, 0);
					wallRootNode.position = new BABYLON.Vector3(0, 0, cm(50));
					break;
				case 's':
					wallRootNode.position = new BABYLON.Vector3(0, 0, cm(-50));
					break;
				case 'w':
					wallRootNode.rotation = new BABYLON.Vector3(0, -Math.PI / 2, 0);
					wallRootNode.position = new BABYLON.Vector3(cm(50), 0, 0);
					break;
				case 'e':
					wallRootNode.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
					wallRootNode.position = new BABYLON.Vector3(cm(-50), 0, 0);
					break;
			}

			const beamMesh = wallRootNode.getChildMeshes().find(m => m.name.includes('__BEAM__'));
			beamMesh.isVisible = wallDef.withBeam === true;

			const baseboardMesh = wallRootNode.getChildMeshes().find(m => m.name.includes('__BASEBOARD__'));
			baseboardMesh.isVisible = wallDef.withBaseboard === true;

			switch (wallDef.type) {
				case 'window': {
					const wallNode = this.wallBRootNode.clone('', wallRootNode)!;
					const wallMesh = wallNode.getChildMeshes().find(m => m.name.includes('__WALL__'))!;
					wallMesh.material = wallDef.material != null && this.wallMaterials[wallDef.material] != null ? this.wallMaterials[wallDef.material] : defaultWallMaterial;
					break;
				}
				case 'door': {
					//wallMeshOriginal = this.wallAMesh;
					break;
				}
				default: {
					const wallNode = this.wallARootNode.clone('', wallRootNode)!;
					const wallMesh = wallNode.getChildMeshes().find(m => m.name.includes('__WALL__'))!;
					wallMesh.material = wallDef.material != null && this.wallMaterials[wallDef.material] != null ? this.wallMaterials[wallDef.material] : defaultWallMaterial;
					break;
				}
			}
		};

		if (unitNDef == null) createWall('n');
		if (unitSDef == null) createWall('s');
		if (unitWDef == null) createWall('w');
		if (unitEDef == null) createWall('e');

		for (const mesh of unitRoot.getChildMeshes()) {
			this.meshes.push(mesh);
		}

		this.registerMeshes(unitRoot.getChildMeshes());

		return unitRoot;
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
		this.roomLight.intensity = 0.0005 * WORLD_SCALE * WORLD_SCALE;
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
		if (this.envMapIndoor != null) this.envMapIndoor.level = 0.025;
		for (const m of this.engine.scene.materials) {
			if (m.metadata?.disableEnvMap) {
				m.ambientColor = new BABYLON.Color3(0.025, 0.025, 0.025);
			}
		}
	}

	public applyOptions(options: CustomMadoriEnvOptions) {
		// TODO: 返り値をpromiseにしてちゃんとテクスチャが読み終わってからresolveする

		for (const n of this.unitRootNodes) {
			if (n != null) n.dispose();
		}
		this.unitRootNodes = [];

		for (let z = 0; z < options.dimension[1]; z++) {
			for (let x = 0; x < options.dimension[0]; x++) {
				const node = this.createUnit(options, x, z);
				this.unitRootNodes.push(node);
			}
		}
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
