/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * ペット管理モジュール（FR-022〜FR-024）
 * - 牛・鶏のマップ表示
 * - NPC移動（5-15秒間隔、5ブロック半径）
 * - マルコフ連鎖フレーバーテキスト表示
 */

import * as THREE from 'three';
import { ChickenRenderer } from './chicken-renderer.js';
import { CowRenderer } from './cow-renderer.js';

// FR-022: ペット情報インターフェース
export interface PetInfo {
	id: string;
	type: 'cow' | 'chicken';
	name: string | null;
	ownerName?: string | null;
	ownerId?: string;
	positionX: number;
	positionY: number;
	positionZ: number;
	spawnX: number;
	spawnZ: number;
	flavorText: string;
	hunger?: number;
	happiness?: number;
}

// NPC移動設定
const NPC_MOVE_RADIUS = 5; // 5ブロック半径
const NPC_MOVE_INTERVAL_MIN = 5000; // 5秒
const NPC_MOVE_INTERVAL_MAX = 15000; // 15秒

/**
 * ペット管理クラス
 * ChickenRendererとCowRendererを使用してペットを表示・管理
 */
export class PetManager {
	private scene: THREE.Scene;
	private chickenRenderer: ChickenRenderer;
	private cowRenderer: CowRenderer;
	private petData: Map<string, PetInfo> = new Map();
	private moveTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
	private clock: THREE.Clock;

	constructor(scene: THREE.Scene) {
		this.scene = scene;
		this.chickenRenderer = new ChickenRenderer(scene);
		this.cowRenderer = new CowRenderer(scene);
		this.clock = new THREE.Clock();
	}

	/**
	 * ペットをシーンに追加
	 * @param pet ペット情報
	 */
	public addPet(pet: PetInfo): void {
		// 既存のペットがあれば削除
		if (this.petData.has(pet.id)) {
			this.removePet(pet.id);
		}

		// ペットデータを保存
		this.petData.set(pet.id, pet);

		// 3Dモデルを作成
		const position = new THREE.Vector3(pet.positionX, pet.positionY, pet.positionZ);

		if (pet.type === 'chicken') {
			// 鶏を作成（色はランダム）
			const colors = ['white', 'brown', 'black', 'golden', 'spotted'] as const;
			const color = colors[Math.floor(Math.random() * colors.length)];
			this.chickenRenderer.createChicken(pet.id, {
				position,
				color,
				isRooster: Math.random() < 0.3, // 30%の確率でオンドリ
				size: 0.8,
			});
		} else {
			// 牛を作成（色はランダム）
			const colors = ['holsteinBW', 'holsteinRW', 'jersey', 'angus', 'highland'] as const;
			const color = colors[Math.floor(Math.random() * colors.length)];
			this.cowRenderer.createCow(pet.id, {
				position,
				color,
				size: 0.8,
			});
		}

		// NPC移動タイマーを開始
		this.startMoveTimer(pet.id);
	}

	/**
	 * ペットをシーンから削除
	 * @param petId ペットID
	 */
	public removePet(petId: string): void {
		const pet = this.petData.get(petId);
		if (!pet) return;

		// 移動タイマーを停止
		const timer = this.moveTimers.get(petId);
		if (timer) {
			clearTimeout(timer);
			this.moveTimers.delete(petId);
		}

		// 3Dモデルを削除
		if (pet.type === 'chicken') {
			this.chickenRenderer.removeChicken(petId);
		} else {
			this.cowRenderer.removeCow(petId);
		}

		this.petData.delete(petId);
	}

	/**
	 * NPC移動タイマーを開始
	 * 5-15秒間隔でスポーン位置から5ブロック以内にランダム移動
	 */
	private startMoveTimer(petId: string): void {
		const scheduleNextMove = () => {
			const interval = NPC_MOVE_INTERVAL_MIN +
				Math.random() * (NPC_MOVE_INTERVAL_MAX - NPC_MOVE_INTERVAL_MIN);

			const timer = setTimeout(() => {
				this.movePet(petId);
				scheduleNextMove();
			}, interval);

			this.moveTimers.set(petId, timer);
		};

		scheduleNextMove();
	}

	/**
	 * ペットをスポーン位置周辺にランダム移動
	 */
	private movePet(petId: string): void {
		const pet = this.petData.get(petId);
		if (!pet) return;

		if (pet.type === 'chicken') {
			this.chickenRenderer.setWandering(petId, pet.spawnX, pet.spawnZ, NPC_MOVE_RADIUS);
		} else {
			this.cowRenderer.setWandering(petId, pet.spawnX, pet.spawnZ, NPC_MOVE_RADIUS);
		}
	}

	/**
	 * アニメーションを更新
	 */
	public update(): void {
		this.chickenRenderer.update();
		this.cowRenderer.update();
	}

	/**
	 * ペット情報を取得
	 */
	public getPet(petId: string): PetInfo | undefined {
		return this.petData.get(petId);
	}

	/**
	 * 全ペットIDを取得
	 */
	public getAllPetIds(): string[] {
		return Array.from(this.petData.keys());
	}

	/**
	 * 指定位置の近くにいるペットを取得
	 */
	public getNearbyPet(x: number, z: number, radius: number = 2): PetInfo | null {
		for (const pet of this.petData.values()) {
			const dx = pet.positionX - x;
			const dz = pet.positionZ - z;
			const distance = Math.sqrt(dx * dx + dz * dz);
			if (distance <= radius) {
				return pet;
			}
		}
		return null;
	}

	/**
	 * クリック位置のペットを取得（Raycaster用）
	 */
	public getClickedPet(
		raycaster: THREE.Raycaster,
		camera: THREE.Camera,
		mouse: THREE.Vector2,
	): PetInfo | null {
		raycaster.setFromCamera(mouse, camera);

		// 全ペットの3Dオブジェクトを収集
		const objects: THREE.Object3D[] = [];

		for (const petId of this.petData.keys()) {
			const pet = this.petData.get(petId);
			if (!pet) continue;

			let group: THREE.Group | undefined;
			if (pet.type === 'chicken') {
				group = this.chickenRenderer.getChicken(petId);
			} else {
				group = this.cowRenderer.getCow(petId);
			}

			if (group) {
				objects.push(group);
			}
		}

		// レイキャストで交差判定
		const intersects = raycaster.intersectObjects(objects, true);

		if (intersects.length > 0) {
			// クリックされたオブジェクトの親をたどってペットを特定
			const clickedObject = intersects[0].object;

			for (const [petId, pet] of this.petData) {
				let group: THREE.Group | undefined;
				if (pet.type === 'chicken') {
					group = this.chickenRenderer.getChicken(petId);
				} else {
					group = this.cowRenderer.getCow(petId);
				}

				if (group && this.isDescendantOf(clickedObject, group)) {
					return pet;
				}
			}
		}

		return null;
	}

	/**
	 * オブジェクトが親の子孫かどうかを判定
	 */
	private isDescendantOf(child: THREE.Object3D, parent: THREE.Object3D): boolean {
		let current: THREE.Object3D | null = child;
		while (current) {
			if (current === parent) return true;
			current = current.parent;
		}
		return false;
	}

	/**
	 * 複数ペットを一括追加
	 */
	public addPets(pets: PetInfo[]): void {
		for (const pet of pets) {
			this.addPet(pet);
		}
	}

	/**
	 * 全ペットをクリア
	 */
	public dispose(): void {
		// 全タイマーを停止
		for (const timer of this.moveTimers.values()) {
			clearTimeout(timer);
		}
		this.moveTimers.clear();

		// レンダラーを破棄
		this.chickenRenderer.dispose();
		this.cowRenderer.dispose();

		this.petData.clear();
	}
}
