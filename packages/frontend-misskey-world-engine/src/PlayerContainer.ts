/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { WORLD_SCALE } from 'misskey-world/src/utility.js';

export type PlayerProfile = {
	name: string;
	avatarUrl: string;
};

export type PlayerState = {
	position: [number, number, number],
	rotation: [number, number, number],
	sit?: string; // id
};

export class PlayerContainer {
	public id: string;
	private profile: PlayerProfile;
	private root: BABYLON.TransformNode;
	private subRoot: BABYLON.TransformNode | null = null;
	private sr: BABYLON.SnapshotRenderingHelper;
	private scene: BABYLON.Scene;
	public registerMeshes: (meshes: BABYLON.Mesh[]) => void = () => {};

	constructor(params: { id: string; profile: PlayerProfile; state: PlayerState | null; sr: BABYLON.SnapshotRenderingHelper; scene: BABYLON.Scene; }) {
		this.id = params.id;
		this.profile = params.profile;
		this.sr = params.sr;
		this.scene = params.scene;

		this.root = new BABYLON.TransformNode(`player:${this.id}`, params.scene);
		this.root.rotationQuaternion = null;
		if (params.state) this.applyState(params.state, true);
	}

	public async loadAvatar() {
		const filePath = '/client-assets/world/avatars/default.glb';
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
	}

	public applyState(state: PlayerState, forInit = false) {
		this.root.position.set(...state.position);
		this.root.rotation.set(...state.rotation);
		if (!forInit) {
			this.sr.updateMesh(this.root.getChildMeshes());
		}
	}

	public destroy() {
		this.root.dispose();
	}
}
