/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { cm, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { AccessoryContainer } from './avatars/AccessoryContainer.js';
import { getAccessoryDef } from './avatars/accessory-defs.js';
import { Timer } from './utility.js';
import type { WorldAvatar } from 'misskey-world/src/types.js';

export type PlayerProfile = {
	name: string;
	username: string;
	avatarUrl: string;
	worldAvatar: WorldAvatar;
};

export type PlayerState = {
	position: [number, number, number],
	rotation: [number, number, number],
	sit?: string; // id
};

const DEFAULT_FACE_PARTS_EYES = {
	'_none_': null,
	'a': '/client-assets/world/avatars/eyes-a.png',
	'b': '/client-assets/world/avatars/eyes-b.png',
	'c': '/client-assets/world/avatars/eyes-c.png',
	'd': '/client-assets/world/avatars/eyes-d.png',
	'e': '/client-assets/world/avatars/eyes-e.png',
	'f': '/client-assets/world/avatars/eyes-f.png',
	'g': '/client-assets/world/avatars/eyes-g.png',
};

const DEFAULT_FACE_PARTS_MOUTH = {
	'_none_': null,
	'a': '/client-assets/world/avatars/mouth-a.png',
	'b': '/client-assets/world/avatars/mouth-b.png',
	'c': '/client-assets/world/avatars/mouth-c.png',
	'd': '/client-assets/world/avatars/mouth-d.png',
	'e': '/client-assets/world/avatars/mouth-e.png',
	'f': '/client-assets/world/avatars/mouth-f.png',
	'g': '/client-assets/world/avatars/mouth-g.png',
	'h': '/client-assets/world/avatars/mouth-h.png',
};

export class PlayerContainer {
	public id: string;
	private profile: PlayerProfile;
	public root: BABYLON.TransformNode;
	private subRootContainerForAnim: BABYLON.TransformNode;
	private subRoot: BABYLON.TransformNode;
	private modelRoot: BABYLON.TransformNode | null = null;
	private sr: BABYLON.SnapshotRenderingHelper;
	private scene: BABYLON.Scene;
	public registerMeshes: (meshes: BABYLON.Mesh[]) => void = () => {};
	private animationObserver: BABYLON.Observer<BABYLON.Scene> | null = null;
	private accessoryContainers: AccessoryContainer[] = [];
	private timer: Timer = new Timer();

	constructor(params: { id: string; profile: PlayerProfile; state: PlayerState | null; sr: BABYLON.SnapshotRenderingHelper; scene: BABYLON.Scene; }) {
		this.id = params.id;
		this.profile = params.profile;
		this.sr = params.sr;
		this.scene = params.scene;

		this.root = new BABYLON.TransformNode(`player:${this.id}`, params.scene);
		this.root.rotationQuaternion = null;
		this.subRootContainerForAnim = new BABYLON.TransformNode(`player:${this.id}:subRootContainerForAnim`, params.scene);
		this.subRootContainerForAnim.parent = this.root;
		this.subRoot = new BABYLON.TransformNode(`player:${this.id}:subRoot`, params.scene);
		this.subRoot.parent = this.subRootContainerForAnim;
		if (params.state) this.applyState(params.state, true);

		console.log('PlayerContainer created', this.id);
	}

	public async loadAvatar() {
		const filePath = '/client-assets/world/avatars/default.glb';
		const loaderResult = await BABYLON.LoadAssetContainerAsync(filePath, this.scene);

		// babylonによって自動で追加される右手系変換用ノード
		const modelRootMesh = loaderResult.meshes[0] as BABYLON.Mesh;

		// meshじゃなくtransform nodeにしてパフォーマンス向上
		this.modelRoot = new BABYLON.TransformNode('__root__', this.scene);
		this.modelRoot.parent = this.subRoot;
		this.modelRoot.scaling.x = -1;
		this.modelRoot.scaling = this.modelRoot.scaling.scale(WORLD_SCALE);// cmをmに

		for (const m of modelRootMesh.getChildren()) {
			if (m.parent === modelRootMesh) {
				m.parent = this.modelRoot;
			}
		}

		modelRootMesh.dispose();

		//const avatarTex = new BABYLON.Texture(this.profile.avatarUrl, this.scene, false, false);

		const eyesBlinkTexture = new BABYLON.Texture('/client-assets/world/avatars/eyes-blink.png', this.scene, false, false);
		eyesBlinkTexture.hasAlpha = true;

		let eyesTex: BABYLON.Texture | null = null;
		if (this.profile.worldAvatar.eyes.type in DEFAULT_FACE_PARTS_EYES) {
			const eyesTexPath = DEFAULT_FACE_PARTS_EYES[this.profile.worldAvatar.eyes.type];
			if (eyesTexPath) {
				eyesTex = new BABYLON.Texture(eyesTexPath, this.scene, false, false);
				eyesTex.hasAlpha = true;
			}
		}

		let mouthTex: BABYLON.Texture | null = null;
		if (this.profile.worldAvatar.mouth.type in DEFAULT_FACE_PARTS_MOUTH) {
			const mouthTexPath = DEFAULT_FACE_PARTS_MOUTH[this.profile.worldAvatar.mouth.type];
			if (mouthTexPath) {
				mouthTex = new BABYLON.Texture(mouthTexPath, this.scene, false, false);
				mouthTex.hasAlpha = true;
			}
		}

		for (const mesh of this.modelRoot.getChildMeshes()) {
			//if (mesh.name.includes('__AVATAR__')) {
			//	const mat = new BABYLON.PBRMaterial('', this.scene);
			//	mat.albedoColor = new BABYLON.Color3(0.5, 0.5, 0.5);
			//	mat.albedoTexture = avatarTex;
			//	mat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
			//	mat.emissiveTexture = avatarTex;
			//	mat.roughness = 0;
			//	mat.metallic = 0;
			//	mat.backFaceCulling = false;
			//	mesh.material = mat;
			//}
			if (mesh.name.includes('__BODY__')) {
				mesh.material.albedoColor = new BABYLON.Color3(this.profile.worldAvatar.body.color[0], this.profile.worldAvatar.body.color[1], this.profile.worldAvatar.body.color[2]);
			}
			if (mesh.name.includes('__EYES__')) {
				const mat = new BABYLON.PBRMaterial('', this.scene);
				mat.albedoColor = new BABYLON.Color3(this.profile.worldAvatar.eyes.color[0], this.profile.worldAvatar.eyes.color[1], this.profile.worldAvatar.eyes.color[2]);
				mat.albedoTexture = eyesTex;
				mat.roughness = 1;
				mat.metallic = 0;
				mesh.material = mat;

				const blink = () => {
					if (mesh.isDisposed()) return;

					this.sr.disableSnapshotRendering();
					mat.albedoTexture = eyesBlinkTexture;
					this.sr.enableSnapshotRendering();

					this.timer.setTimeout(() => {
						this.sr.disableSnapshotRendering();
						mat.albedoTexture = eyesTex;
						this.sr.enableSnapshotRendering();

						this.timer.setTimeout(() => {
							blink();
						}, Math.random() * 10000);
					}, 100);
				};

				this.timer.setTimeout(() => {
					blink();
				}, Math.random() * 10000);
			}
			if (mesh.name.includes('__MOUTH__')) {
				if (mouthTex != null) {
					const mat = new BABYLON.PBRMaterial('', this.scene);
					mat.albedoColor = new BABYLON.Color3(this.profile.worldAvatar.mouth.color[0], this.profile.worldAvatar.mouth.color[1], this.profile.worldAvatar.mouth.color[2]);
					mat.albedoTexture = mouthTex;
					mat.roughness = 1;
					mat.metallic = 0;
					mesh.material = mat;
				} else {
					mesh.isVisible = false;
				}
			}
		}

		this.registerMeshes(this.modelRoot.getChildMeshes());

		this.accessoryContainers = await Promise.all(this.profile.worldAvatar.accessories.map(ac => this.loadAccessory({
			type: ac.type,
			id: ac.id,
			position: new BABYLON.Vector3(0, cm(20), 0),
			rotation: new BABYLON.Vector3(0, 0, 0),
			options: ac.options,
		})));

		const anim = new BABYLON.Animation('', 'position.y', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
		anim.setKeys([
			{ frame: 0, value: cm(0) },
			{ frame: 30, value: cm(-2) },
			{ frame: 60, value: cm(0) },
			{ frame: 90, value: cm(2) },
			{ frame: 120, value: cm(0) },
		]);
		this.subRootContainerForAnim.animations = [anim];
		this.animationObserver = this.scene.onAfterAnimationsObservable.add(() => {
			this.sr.updateMesh(this.subRootContainerForAnim.getChildMeshes(), false);
		});
		this.scene.beginAnimation(this.subRootContainerForAnim, 0, 120, true);
	}

	private async loadAccessory(args: {
		type: string;
		id: string;
		position: BABYLON.Vector3;
		rotation: BABYLON.Vector3;
		options: Record<string, unknown>;
	}) {
		const def = getAccessoryDef(args.type);

		const container = new AccessoryContainer({
			id: args.id,
			type: args.type,
			position: args.position.clone(),
			rotation: args.rotation.clone(),
			options: args.options,
			sr: this.sr,
			getIsSrReady: () => true,
			lightContainer: this.lightContainer,
			graphicsQuality: this.graphicsQuality,
			scene: this.scene,
		});
		container.registerMeshes = (meshes) => {
			this.registerMeshes(meshes);
		};

		await container.load();

		container.root.parent = this.subRoot;

		return container;
	}

	public applyState(state: PlayerState, forInit = false) {
		this.root.position.set(...state.position);
		this.subRoot.rotation.set(...state.rotation);
		if (!forInit) {
			const meshes = this.root.getChildMeshes();
			if (meshes.length > 0) this.sr.updateMesh(meshes);
		}
	}

	public destroy() {
		this.timer.dispose();
		if (this.animationObserver != null) {
			this.scene.onAfterAnimationsObservable.remove(this.animationObserver);
		}
		for (const ac of this.accessoryContainers) {
			ac.destroy();
		}
		this.accessoryContainers = [];
		this.root.dispose();
	}
}
