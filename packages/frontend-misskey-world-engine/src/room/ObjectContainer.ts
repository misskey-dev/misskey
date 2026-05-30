/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { camelToKebab, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { scaleMorph, Timer } from '../utility.js';
import { convertRawOptions, type ConvertedOptions, type RawOptions } from '../mono.js';
import { getObjectDef } from './object-defs.js';
import { ModelManager, SYSTEM_MESH_NAMES } from './utility.js';
import type { RoomObjectInstance } from './object.js';
import type { RoomAttachments } from 'misskey-world/src/room/type.js';

function mergeMeshes(meshes: BABYLON.Mesh[], root: BABYLON.Mesh, hasTexture: boolean) {
	const excludeMeshes = root.getChildMeshes().filter(m => SYSTEM_MESH_NAMES.some(s => m.name.includes(s)));

	const childMeshes = root.getChildMeshes().filter(m => !excludeMeshes.some(x => x === m) && m.isVisible && !m.isDisposed());

	const toMerge = [] as BABYLON.Mesh[];
	for (const mesh of childMeshes) {
		if (mesh instanceof BABYLON.InstancedMesh) {
			continue;
		}

		if (mesh.hasInstances) continue;

		if (mesh instanceof BABYLON.Mesh) {
			toMerge.push(mesh);
		}
	}

	if (toMerge.length <= 1) { // マージ対象が一つしかない状態でマージするのは単純に無駄なのと、babylonのバグが知らないけどなぜか法線が反転する
		return null;
	}

	for (const mesh of toMerge) {
		if (hasTexture) {
			if (mesh.getVerticesData(BABYLON.VertexBuffer.UVKind) == null) {
				const vertexCount = mesh.getTotalVertices();
				const uvs = new Array(vertexCount * 2).fill(0);
				mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs, false, 2);
			}
			if (mesh.getVerticesData(BABYLON.VertexBuffer.UV2Kind) == null) {
				const vertexCount = mesh.getTotalVertices();
				const uvs = new Array(vertexCount * 2).fill(0);
				mesh.setVerticesData(BABYLON.VertexBuffer.UV2Kind, uvs, false, 2);
			}
		}
	}

	const merged = BABYLON.Mesh.MergeMeshes(toMerge, true, false, undefined, false, true);

	return merged;
}

export class ObjectContainer {
	public id: string;
	public type: string;
	private options: ConvertedOptions;
	public root: BABYLON.TransformNode;
	private subRoot: BABYLON.TransformNode | null = null;
	public instance: RoomObjectInstance | null = null;
	public model: ModelManager | null = null;
	private scene: BABYLON.Scene;
	public registerMeshes: (meshes: BABYLON.Mesh[]) => void = () => {};
	private sr: BABYLON.SnapshotRenderingHelper;
	private getIsSrReady: () => boolean;
	private lightContainer: BABYLON.ClusteredLightContainer;
	private graphicsQuality: number;
	private timer: Timer = new Timer();
	private sitChair: () => void = () => {};

	constructor(args: {
		id: string;
		type: string;
		options: RawOptions;
		roomAttachments: RoomAttachments;
		position: BABYLON.Vector3;
		rotation: BABYLON.Vector3;
		sr: BABYLON.SnapshotRenderingHelper;
		getIsSrReady: () => boolean;
		lightContainer: BABYLON.ClusteredLightContainer;
		scene: BABYLON.Scene;
		graphicsQuality: number;
		sitChair?: () => void;
	}) {
		this.id = args.id;
		this.type = args.type;
		const def = getObjectDef(this.type);
		this.options = convertRawOptions(def.options.schema, args.options, args.roomAttachments);
		this.sr = args.sr;
		this.getIsSrReady = args.getIsSrReady;
		this.lightContainer = args.lightContainer;
		this.scene = args.scene;
		this.graphicsQuality = args.graphicsQuality;
		this.root = new BABYLON.TransformNode(`object_${args.id}_${args.type}`, this.scene);
		this.root.position = args.position;
		this.root.rotation = args.rotation;
		if (args.sitChair != null) this.sitChair = args.sitChair;
	}

	public async load() {
		const def = getObjectDef(this.type);

		const filePath = def.path != null ? `/client-assets/world/objects/${def.path(this.options)}.glb` : `/client-assets/world/objects/${camelToKebab(this.type)}/${camelToKebab(this.type)}.glb`;
		const loaderResult = await BABYLON.LoadAssetContainerAsync(filePath, this.scene);

		// babylonによって自動で追加される右手系変換用ノード
		const subRootMesh = loaderResult.meshes[0] as BABYLON.Mesh;

		// 不要なUVを掃除
		if (!def.hasTexture) {
			for (const m of loaderResult.meshes) {
				if (m.geometry != null) {
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UVKind);
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UV2Kind);
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UV3Kind);
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UV4Kind);
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UV5Kind);
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UV6Kind);
				}
			}
		}

		if (def.canPreMeshesMerging) {
			const merged = mergeMeshes(loaderResult.meshes, subRootMesh, def.hasTexture);
			if (merged != null) {
				merged.setParent(subRootMesh);
				merged.name = 'preMerged';

				merged.material.freeze();
				if (merged.material instanceof BABYLON.MultiMaterial) {
					for (const subMat of merged.material.subMaterials) {
						subMat.freeze();
					}
				}

				// TODO: 再帰的にする
				for (const m of loaderResult.transformNodes) {
					if (m.getChildren().length === 0) {
						m.dispose();
					}
				}
			}
		}

		// meshじゃなくtransform nodeにしてパフォーマンス向上
		this.subRoot = new BABYLON.TransformNode('__root__', this.scene);
		this.subRoot.parent = this.root;
		this.subRoot.scaling.x = -1;
		this.subRoot.scaling = this.subRoot.scaling.scale(WORLD_SCALE);// cmをmに

		for (const m of subRootMesh.getChildren()) {
			if (m.parent === subRootMesh) {
				m.parent = this.subRoot;
			}
		}

		subRootMesh.dispose();

		this.registerMeshes(this.subRoot.getChildMeshes());

		this.model = new ModelManager(this.subRoot, loaderResult.meshes.filter(m => !m.isDisposed() && m.name !== '__root__'), def.hasTexture, (meshes) => {
			this.registerMeshes(meshes);
		});

		this.instance = await def.createInstance({
			scene: this.scene,
			sr: {
				updateMesh: (mesh) => {
					if (!this.getIsSrReady()) return;
					this.sr.updateMesh(mesh);
				},
				reset: () => {
					if (!this.getIsSrReady()) return;
					this.sr.disableSnapshotRendering();
					this.sr.enableSnapshotRendering();
				},
				fixParticleSystem: (ps) => this.sr.fixParticleSystem(ps),
			},
			lc: this.lightContainer,
			root: this.root,
			options: this.options,
			model: this.model!,
			id: this.id,
			timer: this.timer,
			graphicsQuality: this.graphicsQuality,
			reloadModel: () => {
				this.reload();
			},
			sitChair: () => {
				this.sitChair();
			},
			stickyMarkerMeshUpdated: (mesh) => {
				// TODO
				//// stickyな子の位置を更新
				//if (mesh.name.includes('__TOP__')) {
				//	mesh.unfreezeWorldMatrix();
				//	mesh.computeWorldMatrix(true);
				//	const updateChildStickyObjectPosition = (objectId: string) => {
				//		const stickyObjectIds = Array.from(this.roomState.installedObjects.filter(o => o.sticky === objectId)).map(o => o.id);
				//		for (const soid of stickyObjectIds) {
				//			const soMesh = this.objectEntities.get(soid)!.rootMesh;
				//			soMesh.unfreezeWorldMatrix();
				//			for (const m of soMesh.getChildMeshes()) {
				//				m.unfreezeWorldMatrix();
				//			}
				//			console.log(mesh.getAbsolutePosition().y);
				//			soMesh.position.y = mesh.getAbsolutePosition().y;
				//			updateChildStickyObjectPosition(soid);
				//		}
				//	};
				//	updateChildStickyObjectPosition(args.id);
				//}
			},
		});

		this.instance.onInited?.();
	}

	public interact(iid: string | null = null) {
		if (this.instance == null) return;
		if (iid == null) {
			if (this.instance.primaryInteraction != null) {
				this.instance.interactions[this.instance.primaryInteraction].fn();
			}
		} else {
			this.instance.interactions[iid].fn();
		}
	}

	public async reload() {
		this.timer.dispose();
		this.instance?.dispose?.();
		this.instance = null;
		this.model = null;
		this.subRoot?.dispose();
		this.root.removeChild(this.subRoot);
		this.scene.removeTransformNode(this.subRoot);

		this.timer = new Timer();

		await this.load();

		this.sr.disableSnapshotRendering();
		this.sr.enableSnapshotRendering();
	}

	public optionsUpdated(options: RawOptions, key: string, value: any, roomAttachments: RoomAttachments) {
		if (this.instance == null) return;
		const def = getObjectDef(this.type);
		const convertedOptions = convertRawOptions(def.options.schema, options, roomAttachments);
		this.options[key] = convertedOptions[key]; // 参照を切れさせないようにプロパティ個別にmutate
		this.sr.disableSnapshotRendering();
		this.instance.onOptionsUpdated?.([key, this.options[key]]);
		this.sr.enableSnapshotRendering();
	}

	public destroy() {
		this.sr.disableSnapshotRendering();
		this.timer.dispose();
		this.instance?.dispose?.();
		this.subRoot.dispose();
		this.root.dispose();
		this.scene.removeTransformNode(this.root);
		this.sr.enableSnapshotRendering();
	}
}
