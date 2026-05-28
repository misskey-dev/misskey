/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { camelToKebab, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { ModelExplorer, scaleMorph, Timer } from '../utility.js';
import { getAccessoryDef } from './accessory-defs.js';
import type { AvatarAccessoryInstance } from './accessory.js';

export class AccessoryContainer {
	public id: string;
	public type: string;
	private options: Record<string, unknown>;
	public root: BABYLON.TransformNode;
	private subRoot: BABYLON.TransformNode | null = null;
	public instance: AvatarAccessoryInstance | null = null;
	public model: ModelExplorer | null = null;
	private scene: BABYLON.Scene;
	public registerMeshes: (meshes: BABYLON.Mesh[]) => void = () => {};
	private sr: BABYLON.SnapshotRenderingHelper;
	private getIsSrReady: () => boolean;
	private lightContainer: BABYLON.ClusteredLightContainer;
	private graphicsQuality: number;
	private timer: Timer = new Timer();

	constructor(args: {
		id: string;
		type: string;
		options: Record<string, unknown>;
		position: BABYLON.Vector3;
		rotation: BABYLON.Vector3;
		sr: BABYLON.SnapshotRenderingHelper;
		getIsSrReady: () => boolean;
		lightContainer: BABYLON.ClusteredLightContainer;
		scene: BABYLON.Scene;
		graphicsQuality: number;
	}) {
		this.id = args.id;
		this.type = args.type;
		this.options = args.options;
		this.sr = args.sr;
		this.getIsSrReady = args.getIsSrReady;
		this.lightContainer = args.lightContainer;
		this.scene = args.scene;
		this.graphicsQuality = args.graphicsQuality;
		this.root = new BABYLON.TransformNode(`accessory_${args.id}_${args.type}`, this.scene);
		this.root.position = args.position;
		this.root.rotation = args.rotation;
	}

	public async load() {
		const def = getAccessoryDef(this.type);

		const filePath = def.path != null ? `/client-assets/world/avatar-accessories/${def.path(this.options)}.glb` : `/client-assets/world/avatar-accessories/${camelToKebab(this.type)}/${camelToKebab(this.type)}.glb`;
		const loaderResult = await BABYLON.LoadAssetContainerAsync(filePath, this.scene);

		// babylonによって自動で追加される右手系変換用ノード
		const subRootMesh = loaderResult.meshes[0] as BABYLON.Mesh;

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

		this.model = new ModelExplorer(this.subRoot);

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
			timer: this.timer,
			graphicsQuality: this.graphicsQuality,
			reloadModel: () => {
				this.reload();
			},
		});
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

	public optionsUpdated(options: Record<string, unknown>, key: string, value: any) {
		if (this.instance == null) return;
		this.options[key] = options[key]; // 参照を切れさせないようにプロパティ個別にmutate
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
