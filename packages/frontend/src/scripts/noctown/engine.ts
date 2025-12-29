/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Character } from './character.js';
import { addRandomEnvironmentEntities } from './environment.js';
import { createPondMesh } from './pond.js';
import { createLakeMesh } from './lake.js';
import { createFarmPlotMesh } from './farm-plot.js';
import { ChunkEnvironmentRenderer, type EnvironmentObjectData } from './environment-objects.js';
import { PetManager, type PetInfo } from './pet.js';
import { WarpGate, WARP_GATE_COLLISION_RADIUS, type WarpGateConfig } from './warp-gate-object.js';
import { buildShrineWorld, animateSuzu } from './shrine-objects.js';

// FR-022: PetInfo型をre-export
export type { PetInfo } from './pet.js';

// FR-008: 時間帯別ライティング設定
type TimePeriod = 'morning' | 'day' | 'evening' | 'night';

interface LightingConfig {
	ambient: { color: number; intensity: number };
	directional: { color: number; intensity: number; position: [number, number, number] };
	background: number;
	fog: number;
}

const LIGHTING_CONFIG: Record<TimePeriod, LightingConfig> = {
	morning: {
		ambient: { color: 0xffd4a6, intensity: 0.9 }, // 0.6 → 0.9 に明るく
		directional: { color: 0xffaa77, intensity: 1.0, position: [-20, 15, 0] }, // 0.7 → 1.0 に明るく
		background: 0x87ceeb, // 朝の空
		fog: 0x87ceeb,
	},
	day: {
		ambient: { color: 0xffffff, intensity: 1.1 }, // 0.8 → 1.1 に明るく
		directional: { color: 0xffffee, intensity: 1.3, position: [0, 25, 0] }, // 1.0 → 1.3 に明るく
		background: 0x87ceeb, // 昼の空
		fog: 0x87ceeb,
	},
	evening: {
		ambient: { color: 0xff8844, intensity: 0.5 },
		directional: { color: 0xff6644, intensity: 0.6, position: [20, 15, 0] },
		background: 0xff6b35, // 夕焼け
		fog: 0xff6b35,
	},
	night: {
		ambient: { color: 0x334466, intensity: 0.7 },
		directional: { color: 0x8899dd, intensity: 0.9, position: [10, 20, 10] },
		background: 0x0f1225, // 夜空
		fog: 0x0f1225,
	},
};

// 時間帯判定関数（日本時間 JST=UTC+9 を基準とする）
function getCurrentTimePeriod(): TimePeriod {
	const now = new Date();
	// 日本時間（JST）の時刻を取得：UTC + 9時間
	const jstHour = (now.getUTCHours() + 9) % 24;

	console.log('[Noctown Lighting] Current JST hour:', jstHour); // デバッグログ

	if (jstHour >= 6 && jstHour < 9) return 'morning';
	if (jstHour >= 9 && jstHour < 17) return 'day';
	if (jstHour >= 17 && jstHour < 19) return 'evening';
	return 'night';
}

// グラデーション遷移用ヘルパー関数
function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

function lerpColor(colorA: number, colorB: number, t: number): number {
	const rA = (colorA >> 16) & 0xff;
	const gA = (colorA >> 8) & 0xff;
	const bA = colorA & 0xff;
	const rB = (colorB >> 16) & 0xff;
	const gB = (colorB >> 8) & 0xff;
	const bB = colorB & 0xff;
	const r = Math.round(lerp(rA, rB, t));
	const g = Math.round(lerp(gA, gB, t));
	const b = Math.round(lerp(bA, bB, t));
	return (r << 16) | (g << 8) | b;
}

// 時間帯境界でのグラデーション遷移を計算（日本時間基準）
function getTransitionProgress(): { from: TimePeriod; to: TimePeriod; progress: number } | null {
	const now = new Date();
	// 日本時間（JST）の時刻を取得：UTC + 9時間
	const jstHour = (now.getUTCHours() + 9) % 24;
	const minute = now.getUTCMinutes();
	const totalMinutes = jstHour * 60 + minute;

	// 各境界時刻（分）: 朝6:00, 昼9:00, 夕17:00, 夜19:00
	const transitions: { time: number; from: TimePeriod; to: TimePeriod }[] = [
		{ time: 6 * 60, from: 'night', to: 'morning' },
		{ time: 9 * 60, from: 'morning', to: 'day' },
		{ time: 17 * 60, from: 'day', to: 'evening' },
		{ time: 19 * 60, from: 'evening', to: 'night' },
	];

	const TRANSITION_DURATION = 5; // 5分間でグラデーション遷移

	for (const transition of transitions) {
		const start = transition.time - Math.floor(TRANSITION_DURATION / 2);
		const end = transition.time + Math.ceil(TRANSITION_DURATION / 2);

		if (totalMinutes >= start && totalMinutes < end) {
			const progress = (totalMinutes - start) / TRANSITION_DURATION;
			return { from: transition.from, to: transition.to, progress: Math.max(0, Math.min(1, progress)) };
		}
	}

	return null;
}

export interface PlayerData {
	id: string;
	userId: string;
	username: string;
	name: string | null;
	avatarUrl: string | null;
	positionX: number;
	positionY: number;
	positionZ: number;
	rotation: number;
	isOnline: boolean;
	isTrading?: boolean;
}

export interface ChunkData {
	chunkX: number;
	chunkZ: number;
	worldId?: string;
	terrainData: number[] | {
		heightMap: number[][];
		version: number;
	};
	biome: string;
	environmentObjects?: EnvironmentObjectData[];
}

// 仕様: FR-030 ドロップアイテムの絵文字表現と拾得システム
export interface DroppedItemData {
	id: string;
	itemId: string;
	itemName: string;
	itemType: string;
	emoji: string | null;
	imageUrl: string | null;
	rarity: number;
	quantity: number;
	positionX: number;
	positionY: number;
	positionZ: number;
}

export interface PlacedItemData {
	id: string;
	itemId: string;
	itemName: string;
	itemType: string;
	// FR-032: 設置者のプレイヤーID（回収権限判定用）
	// 仕様: nullの場合は「不明」として表示
	ownerId: string | null;
	ownerUsername: string | null;
	positionX: number;
	positionY: number;
	positionZ: number;
	rotation: number;
}

export interface NpcData {
	id: string;
	playerId: string;
	username: string;
	avatarUrl: string | null;
	positionX: number;
	positionY: number;
	positionZ: number;
}

export class NoctownEngine {
	private scene: THREE.Scene;
	private camera: THREE.OrthographicCamera;
	private renderer: THREE.WebGLRenderer;
	private labelRenderer: CSS2DRenderer;
	private container: HTMLElement;
	private animationId: number | null = null;

	// Player management
	private localPlayer: Character | null = null;
	private localPlayerId: string | null = null; // 自プレイヤーのID
	private remotePlayers: Map<string, Character> = new Map();
	private lastMoveDirection: { x: number; z: number } = { x: 0, z: 0 };
	private lastFrameTime: number = 0;
	private currentInput: { up: boolean; down: boolean; left: boolean; right: boolean; sprint: boolean } = {
		up: false,
		down: false,
		left: false,
		right: false,
		sprint: false,
	};
	// ジョイスティック入力がアクティブかどうか（setInput()で設定され、clearInput()でリセット）
	private isJoystickActive: boolean = false;
	// Track remote player positions for movement direction calculation
	// 仕様: animateループで前回の実際の描画位置を保存し、次フレームで移動方向を計算する
	// 修正日: 2025-12-14
	// 修正内容: updateRemotePlayerで目標位置を保存していたため、lerp中に逆方向を計算してしまう問題を修正
	private remotePlayerLastPos: Map<string, { x: number; z: number; time: number }> = new Map();

	// World management
	private chunks: Map<string, THREE.Group> = new Map();

	// Item management
	// 仕様: FR-030 ドロップアイテムは3Dグループ（球体 + CSS2D絵文字ラベル）で管理
	private droppedItems: Map<string, THREE.Group> = new Map();
	private droppedItemLabels: Map<string, CSS2DObject> = new Map();
	// 仕様: ふわふわアニメーション用の基準位置とオフセット
	private droppedItemBaseY: Map<string, number> = new Map();
	private placedItems: Map<string, THREE.Group> = new Map();

	// NPC management
	private npcs: Map<string, THREE.Group> = new Map();
	private npcLabels: Map<string, THREE.Sprite> = new Map();

	// FR-018: Raycaster for player click detection
	private raycaster: THREE.Raycaster = new THREE.Raycaster();
	private mouse: THREE.Vector2 = new THREE.Vector2();
	private remotePlayerData: Map<string, PlayerData> = new Map();

	// Camera follow
	private cameraOffset = new THREE.Vector3(0, 10, 15);
	private cameraLookAtTarget = new THREE.Vector3(0, 0, 0);

	// Input state
	private keys: Set<string> = new Set();
	private isDisposed = false;

	// FR-008: 時間帯別ライティング
	private ambientLight: THREE.AmbientLight | null = null;
	private directionalLight: THREE.DirectionalLight | null = null;
	private currentTimePeriod: TimePeriod = 'night';
	private lastTimeCheck: number = 0;

	// FR-022: ペット管理
	private petManager: PetManager | null = null;

	// 仕様: 神社ワールド - ワープゲート管理
	private warpGates: Map<string, WarpGate> = new Map();
	private currentWorldType: 'default' | 'shrine' = 'default';
	private currentWorldId: string | null = null;
	private shrineObjects: THREE.Group | null = null;
	private isWarping: boolean = false; // T026: ワープ中フラグ
	private suzuAnimationData: { group: THREE.Group; startTime: number } | null = null;
	private onWarpCollision: ((gateId: string, targetWorldId: string | null) => void) | null = null;

	constructor(container: HTMLElement) {
		this.container = container;

		// Scene - FR-008: 背景色と霧はsetupLights()で時間帯に応じて設定
		this.scene = new THREE.Scene();

		// Camera - Quarter View (Orthographic)
		const aspect = container.clientWidth / container.clientHeight;
		const viewSize = 10;
		this.camera = new THREE.OrthographicCamera(
			-viewSize * aspect,
			viewSize * aspect,
			viewSize,
			-viewSize,
			0.1,
			1000,
		);
		// Animal Crossing style - front top-down view
		this.camera.position.set(0, 15, 20);
		this.camera.lookAt(0, 0, 0);

		// Renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(container.clientWidth, container.clientHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		// 仕様: z-indexを明示的に設定してUIパネルより下になるようにする
		this.renderer.domElement.style.position = 'relative';
		this.renderer.domElement.style.zIndex = '1';
		container.appendChild(this.renderer.domElement);

		// CSS2D Renderer for labels
		this.labelRenderer = new CSS2DRenderer();
		this.labelRenderer.setSize(container.clientWidth, container.clientHeight);
		this.labelRenderer.domElement.style.position = 'absolute';
		this.labelRenderer.domElement.style.top = '0';
		this.labelRenderer.domElement.style.pointerEvents = 'none';
		// 仕様: ラベルレンダラーもz-indexを設定
		this.labelRenderer.domElement.style.zIndex = '2';
		container.appendChild(this.labelRenderer.domElement);

		// Lights
		this.setupLights();

		// Ground plane (temporary)
		this.createGroundPlane();

		// FR-022: ペット管理の初期化
		this.petManager = new PetManager(this.scene);

		// Event listeners
		this.setupEventListeners();

		// Start render loop
		this.animate();
	}

	private setupLights(): void {
		// FR-008: 時間帯別ライティング設定
		this.currentTimePeriod = getCurrentTimePeriod();
		const config = LIGHTING_CONFIG[this.currentTimePeriod];

		// 背景色と霧を時間帯に合わせて設定
		this.scene.background = new THREE.Color(config.background);
		this.scene.fog = new THREE.Fog(config.fog, 50, 120);

		// アンビエントライト
		this.ambientLight = new THREE.AmbientLight(config.ambient.color, config.ambient.intensity);
		this.scene.add(this.ambientLight);

		// ディレクショナルライト（太陽/月）
		this.directionalLight = new THREE.DirectionalLight(config.directional.color, config.directional.intensity);
		this.directionalLight.position.set(...config.directional.position);
		this.directionalLight.castShadow = true;
		this.directionalLight.shadow.mapSize.width = 2048;
		this.directionalLight.shadow.mapSize.height = 2048;
		this.directionalLight.shadow.camera.near = 0.5;
		this.directionalLight.shadow.camera.far = 50;
		this.directionalLight.shadow.camera.left = -20;
		this.directionalLight.shadow.camera.right = 20;
		this.directionalLight.shadow.camera.top = 20;
		this.directionalLight.shadow.camera.bottom = -20;
		this.scene.add(this.directionalLight);
		this.scene.add(this.directionalLight.target);

		// 月を追加（夜のみ表示）
		const moonGeo = new THREE.SphereGeometry(3, 32, 32);
		const moonMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
		const moon = new THREE.Mesh(moonGeo, moonMat);
		moon.position.set(50, 60, -80);
		moon.name = 'moon';
		moon.visible = this.currentTimePeriod === 'night';
		this.scene.add(moon);

		// 月のグロー効果
		const moonGlowGeo = new THREE.SphereGeometry(4, 32, 32);
		const moonGlowMat = new THREE.MeshBasicMaterial({
			color: 0x4466aa,
			transparent: true,
			opacity: 0.3
		});
		const moonGlow = new THREE.Mesh(moonGlowGeo, moonGlowMat);
		moonGlow.position.set(50, 60, -80);
		moonGlow.name = 'moonGlow';
		moonGlow.visible = this.currentTimePeriod === 'night';
		this.scene.add(moonGlow);

		// 星空を追加（夜のみ表示）
		const starsGeometry = new THREE.BufferGeometry();
		const starPositions: number[] = [];
		for (let i = 0; i < 1000; i++) {
			const x = (Math.random() - 0.5) * 500;
			const y = Math.random() * 100 + 30;
			const z = (Math.random() - 0.5) * 500;
			starPositions.push(x, y, z);
		}
		starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
		const starsMaterial = new THREE.PointsMaterial({
			color: 0xffffff,
			size: 0.3,
			transparent: true,
			opacity: 0.8
		});
		const stars = new THREE.Points(starsGeometry, starsMaterial);
		stars.name = 'stars';
		stars.visible = this.currentTimePeriod === 'night';
		this.scene.add(stars);
	}

	// FR-008: 時間帯別ライティング更新
	private updateLighting(): void {
		// DirectionalLightのプレイヤー追従は毎フレーム実行
		if (this.directionalLight && this.localPlayer) {
			const config = LIGHTING_CONFIG[this.currentTimePeriod];
			const basePos = config.directional.position;
			const playerPos = this.localPlayer.getPosition();
			this.directionalLight.position.set(
				playerPos.x + basePos[0],
				basePos[1],
				playerPos.z + basePos[2]
			);
			this.directionalLight.target.position.set(playerPos.x, 0, playerPos.z);
		}

		const now = Date.now();
		// 1秒ごとに時間帯をチェック（パフォーマンス最適化）
		if (now - this.lastTimeCheck < 1000) return;
		this.lastTimeCheck = now;

		const transition = getTransitionProgress();
		let targetConfig: LightingConfig;
		let needsUpdate = false;

		if (transition) {
			// グラデーション遷移中
			const fromConfig = LIGHTING_CONFIG[transition.from];
			const toConfig = LIGHTING_CONFIG[transition.to];
			const t = transition.progress;

			targetConfig = {
				ambient: {
					color: lerpColor(fromConfig.ambient.color, toConfig.ambient.color, t),
					intensity: lerp(fromConfig.ambient.intensity, toConfig.ambient.intensity, t),
				},
				directional: {
					color: lerpColor(fromConfig.directional.color, toConfig.directional.color, t),
					intensity: lerp(fromConfig.directional.intensity, toConfig.directional.intensity, t),
					position: [
						lerp(fromConfig.directional.position[0], toConfig.directional.position[0], t),
						lerp(fromConfig.directional.position[1], toConfig.directional.position[1], t),
						lerp(fromConfig.directional.position[2], toConfig.directional.position[2], t),
					] as [number, number, number],
				},
				background: lerpColor(fromConfig.background, toConfig.background, t),
				fog: lerpColor(fromConfig.fog, toConfig.fog, t),
			};
			needsUpdate = true;

			// 時間帯が変わったかチェック
			const newPeriod = t >= 0.5 ? transition.to : transition.from;
			if (newPeriod !== this.currentTimePeriod) {
				this.currentTimePeriod = newPeriod;
				this.updateNightObjects();
			}
		} else {
			const newPeriod = getCurrentTimePeriod();
			if (newPeriod !== this.currentTimePeriod) {
				this.currentTimePeriod = newPeriod;
				targetConfig = LIGHTING_CONFIG[newPeriod];
				this.updateNightObjects();
				needsUpdate = true;
			} else {
				return; // 時間帯の変更なし、プレイヤー追従は上で処理済み
			}
		}

		if (!needsUpdate) return;

		// ライティングを更新
		if (this.ambientLight) {
			this.ambientLight.color.setHex(targetConfig.ambient.color);
			this.ambientLight.intensity = targetConfig.ambient.intensity;
		}

		if (this.directionalLight) {
			this.directionalLight.color.setHex(targetConfig.directional.color);
			this.directionalLight.intensity = targetConfig.directional.intensity;
		}

		// 背景色と霧を更新
		(this.scene.background as THREE.Color).setHex(targetConfig.background);
		if (this.scene.fog instanceof THREE.Fog) {
			this.scene.fog.color.setHex(targetConfig.fog);
		}
	}

	// 夜専用オブジェクト（月、星）の表示/非表示を切り替え
	private updateNightObjects(): void {
		const isNight = this.currentTimePeriod === 'night';
		const moon = this.scene.getObjectByName('moon');
		const moonGlow = this.scene.getObjectByName('moonGlow');
		const stars = this.scene.getObjectByName('stars');

		if (moon) moon.visible = isNight;
		if (moonGlow) moonGlow.visible = isNight;
		if (stars) stars.visible = isNight;
	}

	private createGroundPlane(): void {
		const geometry = new THREE.PlaneGeometry(500, 500);
		const material = new THREE.MeshStandardMaterial({
			color: 0x2a3a2a, // 夜の草地（少し明るめ）
			roughness: 0.9,
		});
		const ground = new THREE.Mesh(geometry, material);
		ground.rotation.x = -Math.PI / 2;
		ground.position.y = 0;
		ground.receiveShadow = true;
		this.scene.add(ground);
	}

	/**
	 * Render chunk with grid lines (FR-073, FR-074)
	 * @param chunkData Chunk data from server
	 */
	// FR-001: terrainDataに基づいてチャンクを生成
	// 修正: チャンクキー形式をカンマ区切りに統一（他のモジュールと一致させる）
	public async renderChunk(chunkData: ChunkData): Promise<void> {
		const key = `${chunkData.chunkX},${chunkData.chunkZ}`;
		if (this.chunks.has(key)) return; // Already rendered

		const CHUNK_SIZE = 16;
		const offsetX = chunkData.chunkX * CHUNK_SIZE;
		const offsetZ = chunkData.chunkZ * CHUNK_SIZE;

		const chunkGroup = new THREE.Group();
		chunkGroup.position.set(offsetX, 0, offsetZ);

		// FR-001: Add grid helper (character-demo+14-fishing準拠)
		const gridHelper = new THREE.GridHelper(CHUNK_SIZE, CHUNK_SIZE, 0x2a3a3a, 0x2a3a3a);
		gridHelper.position.set(0, 0.01, 0); // y=0.01 to avoid z-fighting
		chunkGroup.add(gridHelper);

		// FR-001: terrainDataに基づいて地形を生成
		// 池・湖は連続領域の中心に1つだけ配置する（重複生成を防ぐ）
		if (chunkData.terrainData && Array.isArray(chunkData.terrainData)) {
			const { createPondMesh } = await import('./pond.js');
			const { createLakeMesh } = await import('./lake.js');
			const { createFarmPlotMesh } = await import('./farm-plot.js');

			// 池・湖の領域を検出して中心座標を計算
			const processedTiles = new Set<string>();
			const findTerrainCenter = (startX: number, startZ: number, targetType: number): { centerX: number; centerZ: number } | null => {
				const tiles: Array<{ x: number; z: number }> = [];
				const stack: Array<{ x: number; z: number }> = [{ x: startX, z: startZ }];

				while (stack.length > 0) {
					const { x, z } = stack.pop()!;
					const key = `${x},${z}`;
					if (processedTiles.has(key)) continue;
					if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) continue;
					if (chunkData.terrainData[x * CHUNK_SIZE + z] !== targetType) continue;

					processedTiles.add(key);
					tiles.push({ x, z });

					// 4方向を探索
					stack.push({ x: x + 1, z });
					stack.push({ x: x - 1, z });
					stack.push({ x, z: z + 1 });
					stack.push({ x, z: z - 1 });
				}

				if (tiles.length === 0) return null;

				// 中心座標を計算
				const sumX = tiles.reduce((sum, t) => sum + t.x, 0);
				const sumZ = tiles.reduce((sum, t) => sum + t.z, 0);
				return {
					centerX: sumX / tiles.length,
					centerZ: sumZ / tiles.length,
				};
			};

			// terrainDataを走査して地形タイプに応じたメッシュを追加
			for (let x = 0; x < CHUNK_SIZE; x++) {
				for (let z = 0; z < CHUNK_SIZE; z++) {
					const terrainType = chunkData.terrainData[x * CHUNK_SIZE + z];
					const tileKey = `${x},${z}`;

					if (terrainType === 1 && !processedTiles.has(tileKey)) {
						// FR-001: 池領域の中心に1つだけ生成
						const center = findTerrainCenter(x, z, 1);
						if (center) {
							const worldX = offsetX + center.centerX;
							const worldZ = offsetZ + center.centerZ;
							const seed = Math.floor(worldX) * 1000 + Math.floor(worldZ);
							const pond = createPondMesh(worldX, worldZ, seed);
							chunkGroup.add(pond);
						}
					} else if (terrainType === 2 && !processedTiles.has(tileKey)) {
						// FR-001: 湖領域の中心に1つだけ生成
						const center = findTerrainCenter(x, z, 2);
						if (center) {
							const worldX = offsetX + center.centerX;
							const worldZ = offsetZ + center.centerZ;
							const seed = Math.floor(worldX) * 1000 + Math.floor(worldZ);
							const lake = createLakeMesh(worldX, worldZ, seed);
							chunkGroup.add(lake);
						}
					} else if (terrainType === 3) {
						// FR-001: 農園プロットはタイルごとに生成
						const worldX = offsetX + x;
						const worldZ = offsetZ + z;
						const farmPlot = createFarmPlotMesh(worldX, worldZ);
						chunkGroup.add(farmPlot.group);
					}
				}
			}
		}

		this.scene.add(chunkGroup);
		this.chunks.set(key, chunkGroup);

		// FR-010: Add environment entities from backend data（chunkGroupに追加してリロード時に削除されるようにする）
		if (chunkData.environmentObjects && Array.isArray(chunkData.environmentObjects)) {
			const { addTree, addRock } = await import('./environment.js');
			for (const obj of chunkData.environmentObjects) {
				const worldX = offsetX + obj.localX;
				const worldZ = offsetZ + obj.localZ;

				if (obj.type === 'tree') {
					addTree(chunkGroup, worldX, worldZ);
				} else if (obj.type === 'rock') {
					const scale = obj.scale ?? 1.0;
					addRock(chunkGroup, worldX, worldZ, scale);
				}
			}
		} else {
			// Fallback: Use client-side generation if no backend data（chunkGroupに追加）
			addRandomEnvironmentEntities(chunkGroup, chunkData.chunkX, chunkData.chunkZ, CHUNK_SIZE);
		}
	}

	/**
	 * Remove chunk from scene (FR-074: VIEW_DISTANCE management)
	 * @param chunkX Chunk X coordinate
	 * @param chunkZ Chunk Z coordinate
	 * 修正: チャンクキー形式をカンマ区切りに統一（他のモジュールと一致させる）
	 */
	public removeChunk(chunkX: number, chunkZ: number): void {
		const key = `${chunkX},${chunkZ}`;
		const chunk = this.chunks.get(key);
		if (chunk) {
			this.scene.remove(chunk);
			this.chunks.delete(key);
		}
	}

	private setupEventListeners(): void {
		window.addEventListener('resize', this.onResize);
		window.addEventListener('keydown', this.onKeyDown);
		window.addEventListener('keyup', this.onKeyUp);
	}

	private onResize = (): void => {
		if (this.isDisposed) return;
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;
		const aspect = width / height;
		const viewSize = 10;
		this.camera.left = -viewSize * aspect;
		this.camera.right = viewSize * aspect;
		this.camera.top = viewSize;
		this.camera.bottom = -viewSize;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);
		this.labelRenderer.setSize(width, height);
	};

	/**
	 * 仕様: キーダウンイベントハンドラー
	 * - テキスト入力フィールド（input, textarea）にフォーカスがある場合は無視
	 * - contentEditable要素にフォーカスがある場合も無視
	 * - それ以外の場合のみキー入力を記録
	 * 修正日: 2025-12-14
	 * 修正内容: チャット入力中に矢印キーで移動してしまう問題を修正
	 */
	private onKeyDown = (e: KeyboardEvent): void => {
		// チャット入力などのテキストフィールドにフォーカスがある場合は移動キーを無視
		const target = e.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}
		this.keys.add(e.code);
	};

	private onKeyUp = (e: KeyboardEvent): void => {
		this.keys.delete(e.code);
	};

	private animate = (): void => {
		if (this.isDisposed) return;
		this.animationId = requestAnimationFrame(this.animate);

		// Calculate delta time
		const now = performance.now();
		const deltaTime = this.lastFrameTime > 0 ? (now - this.lastFrameTime) / 1000 : 0.016;
		this.lastFrameTime = now;

		/**
		 * 仕様: キーボード入力の状態をcurrentInputに反映
		 * - ジョイスティック入力がアクティブな場合: setInput()で設定された値を維持
		 * - キーボード入力のみの場合: keys Setの状態を反映
		 * 修正: キーを離した時にcurrentInputがリセットされない問題を修正
		 *       isJoystickActiveフラグを使用してジョイスティック入力時はキーボード処理をスキップ
		 * 修正日: 2025-12-14
		 */
		// ジョイスティック入力がアクティブな場合はsetInput()で設定された値を使用
		// キーボード入力のみの場合はkeys Setの状態を反映
		if (!this.isJoystickActive) {
			this.currentInput.up = this.keys.has('ArrowUp');
			this.currentInput.down = this.keys.has('ArrowDown');
			this.currentInput.left = this.keys.has('ArrowLeft');
			this.currentInput.right = this.keys.has('ArrowRight');
			this.currentInput.sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
		}

		// T088: Update character animations with input-based animation (like character-demo.html)
		// Note: Character.update() handles both movement and animation, but in Noctown,
		// movement is handled by index.vue. We only need animation updates here.
		if (this.localPlayer) {
			// Use currentInput to determine if player is moving
			const moveX = (this.currentInput.right ? 1 : 0) - (this.currentInput.left ? 1 : 0);
			const moveZ = (this.currentInput.down ? 1 : 0) - (this.currentInput.up ? 1 : 0);
			this.localPlayer.updateAnimation(moveX, moveZ, deltaTime);
		}

		/**
		 * 仕様: リモートプレイヤーのアニメーション更新
		 * - lerp位置を更新し、前フレームの位置との差分から移動方向を計算
		 * - 位置の保存はアニメーション更新後に行う（実際の描画位置を使用）
		 * 修正日: 2025-12-14
		 * 修正内容: updateRemotePlayerで目標位置を保存していたためlerp中に逆方向を計算していた問題を修正
		 */
		for (const [playerId, character] of this.remotePlayers) {
			// FR-070: Update lerp position for smooth WebSocket sync
			character.updateLerp();

			// Get current position (actual rendered position after lerp update)
			const currentPos = character.getPosition();
			const now = Date.now();

			const lastPos = this.remotePlayerLastPos.get(playerId);
			if (!lastPos) {
				// No previous position data - initialize and assume idle
				this.remotePlayerLastPos.set(playerId, {
					x: currentPos.x,
					z: currentPos.z,
					time: now,
				});
				character.updateAnimation(0, 0, deltaTime);
				continue;
			}

			const timeDiff = now - lastPos.time;

			// Calculate movement direction (if moved recently)
			let moveX = 0;
			let moveZ = 0;
			if (timeDiff < 500) { // Only animate if position updated within last 500ms
				const dx = currentPos.x - lastPos.x;
				const dz = currentPos.z - lastPos.z;
				const moveLength = Math.sqrt(dx * dx + dz * dz);

				// Lower threshold for remote players to ensure rotation updates
				if (moveLength > 0.0001) {
					moveX = dx / moveLength;
					moveZ = dz / moveLength;
				}
			}

			// Save current position for next frame's direction calculation
			this.remotePlayerLastPos.set(playerId, {
				x: currentPos.x,
				z: currentPos.z,
				time: now,
			});

			character.updateAnimation(moveX, moveZ, deltaTime);
		}

		// Update camera to follow player
		if (this.localPlayer) {
			const targetPos = this.localPlayer.group.position.clone().add(this.cameraOffset);
			this.camera.position.lerp(targetPos, 0.1);

			// Smoothly interpolate camera lookAt target to avoid sudden camera jerks
			this.cameraLookAtTarget.lerp(this.localPlayer.group.position, 0.1);
			this.camera.lookAt(this.cameraLookAtTarget);
		}

		// FR-008: 時間帯別ライティング更新
		this.updateLighting();

		// FR-022: ペットアニメーション更新
		if (this.petManager) {
			this.petManager.update();
		}

		// 仕様: FR-030 ドロップアイテムのふわふわアニメーション
		// Math.sin(time * 2) * 0.1 で上下に揺れる
		const time = now * 0.001; // Convert to seconds
		for (const [itemId, group] of this.droppedItems) {
			const baseY = this.droppedItemBaseY.get(itemId);
			if (baseY !== undefined) {
				// 各アイテムにオフセットを追加（個体差のため）
				const offset = (parseInt(itemId, 36) % 100) / 100 * Math.PI * 2;
				group.position.y = baseY + Math.sin(time * 2 + offset) * 0.1;
				// Y軸方向に緩やかに回転（0.5rad/sec）
				group.rotation.y = time * 0.5 + offset;
			}
		}

		// 仕様: ケーキのキャンドル炎アニメーションは負荷軽減のためOFF

		// 仕様: T020 ワープゲート衝突チェックとアニメーション更新
		this.checkWarpGateCollisions();
		this.updateWarpGatesAndShrine(deltaTime);

		this.renderer.render(this.scene, this.camera);
		this.labelRenderer.render(this.scene, this.camera);
	};

	// Player management
	public createLocalPlayer(data: PlayerData): void {
		if (this.localPlayer) {
			this.scene.remove(this.localPlayer.group);
		}

		// 自プレイヤーのIDを保存
		this.localPlayerId = data.id;

		// Create Character instance
		this.localPlayer = new Character();
		this.localPlayer.setPosition(data.positionX, data.positionY, data.positionZ);
		this.localPlayer.setRotation(data.rotation);
		this.localPlayer.setCastShadow(true);

		// T008, T009: Set player name and online status
		this.localPlayer.setName(data.username);
		this.localPlayer.setOnline(data.isOnline);

		// FR-017: Mark as local player (always green status mark)
		this.localPlayer.setAsLocalPlayer();

		// Set icon (always set, using identicon as fallback)
		this.localPlayer.setIcon(data.avatarUrl, data.username);

		this.scene.add(this.localPlayer.group);
	}

	public updateLocalPlayerPosition(x: number, y: number, z: number, rotation: number): void {
		if (!this.localPlayer) return;

		// Calculate movement direction from position change
		const oldPos = this.localPlayer.getPosition();
		const dx = x - oldPos.x;
		const dz = z - oldPos.z;
		const moveLength = Math.sqrt(dx * dx + dz * dz);

		// Normalize movement direction for animation
		if (moveLength > 0.001) {
			this.lastMoveDirection.x = dx / moveLength;
			this.lastMoveDirection.z = dz / moveLength;
		} else {
			this.lastMoveDirection.x = 0;
			this.lastMoveDirection.z = 0;
		}

		this.localPlayer.setPosition(x, y, z);
		this.localPlayer.setRotation(rotation);
	}

	// T014-T016: showLocalPlayerEmote updated for custom emoji support
	public showLocalPlayerEmote(emoji: string, isCustom?: boolean, url?: string): void {
		if (!this.localPlayer) return;
		this.localPlayer.showEmote(emoji, isCustom, url);
	}

	// T014-T016: showRemotePlayerEmote updated for custom emoji support
	public showRemotePlayerEmote(playerId: string, emoji: string, isCustom?: boolean, url?: string): void {
		const character = this.remotePlayers.get(playerId);
		if (!character) return;
		character.showEmote(emoji, isCustom, url);
	}

	public showLocalPlayerChat(message: string): void {
		if (!this.localPlayer) return;
		this.localPlayer.showChatMessage(message);
	}

	public showRemotePlayerChat(playerId: string, message: string): void {
		const character = this.remotePlayers.get(playerId);
		if (!character) return;
		character.showChatMessage(message);
	}

	// FR-019: Show/hide typing indicator for local player
	public showLocalPlayerTyping(isTyping: boolean): void {
		if (!this.localPlayer) return;
		this.localPlayer.showTypingIndicator(isTyping);
	}

	// FR-019: Show/hide typing indicator for remote player
	public showRemotePlayerTyping(playerId: string, isTyping: boolean): void {
		const character = this.remotePlayers.get(playerId);
		if (!character) return;
		character.showTypingIndicator(isTyping);
	}

	/**
	 * 仕様: ジョイスティック入力を設定
	 * - isJoystickActiveフラグをtrueにして、キーボード処理をスキップ
	 * 修正日: 2025-12-14
	 */
	public setInput(input: { up: boolean; down: boolean; left: boolean; right: boolean; sprint: boolean }): void {
		this.currentInput = { ...input };
		this.isJoystickActive = true;
	}

	/**
	 * 仕様: ジョイスティック入力をクリア（ジョイスティックを離した時に呼ぶ）
	 * - isJoystickActiveフラグをfalseにして、キーボード処理を再開
	 * - currentInputを全てfalseにリセット
	 * 修正日: 2025-12-14
	 */
	public clearInput(): void {
		this.currentInput = {
			up: false,
			down: false,
			left: false,
			right: false,
			sprint: false,
		};
		this.isJoystickActive = false;
	}

	/**
	 * 仕様: リモートプレイヤーを追加
	 * 修正: 自プレイヤーの判定を強化し、デバッグログを追加
	 * 修正日: 2025-12-14
	 */
	public addRemotePlayer(data: PlayerData): void {
		// デバッグログ: addRemotePlayer呼び出し内容を確認
		console.log('[addRemotePlayer] Called with:', {
			dataId: data.id,
			localPlayerId: this.localPlayerId,
			isLocalPlayer: data.id === this.localPlayerId,
			username: data.username,
			data,
		});

		// 自プレイヤーは追加しない
		if (data.id === this.localPlayerId) {
			console.warn('[addRemotePlayer] Attempted to add local player, skipping');
			return;
		}

		if (this.remotePlayers.has(data.id)) {
			console.log('[addRemotePlayer] Player already exists, updating instead:', data.id);
			this.updateRemotePlayer(data);
			return;
		}

		// Create Character instance
		const character = new Character();
		character.setPosition(data.positionX, data.positionY, data.positionZ);
		character.setRotation(data.rotation);
		character.setCastShadow(true);

		// FR-070: Enable linear interpolation for smooth WebSocket position sync
		character.enableLerp(100); // 100ms lerp duration

		// Set player name and online status
		character.setName(data.username);
		character.setOnline(data.isOnline);

		// 仕様: トレード中状態を設定
		if (data.isTrading !== undefined) {
			character.setTrading(data.isTrading);
		}

		// Set icon (always set, using identicon as fallback)
		character.setIcon(data.avatarUrl, data.username);

		this.scene.add(character.group);
		this.remotePlayers.set(data.id, character);

		// FR-018: Store player data for info window
		this.remotePlayerData.set(data.id, data);

		// FR-022: Apply visual effects for offline players (NPC)
		if (!data.isOnline) {
			character.group.traverse((child) => {
				if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
					child.material.opacity = 0.7;
					child.material.transparent = true;
				}
			});
		}
	}

	/**
	 * 仕様: リモートプレイヤーの位置を更新
	 * 修正: 自プレイヤーの判定を強化し、デバッグログを追加
	 * 修正日: 2025-12-14
	 */
	public updateRemotePlayer(data: PlayerData): void {
		// デバッグログ: updateRemotePlayer呼び出し内容を確認
		console.log('[updateRemotePlayer] Called with:', {
			dataId: data.id,
			localPlayerId: this.localPlayerId,
			isLocalPlayer: data.id === this.localPlayerId,
			username: data.username,
			position: { x: data.positionX, y: data.positionY, z: data.positionZ },
			rotation: data.rotation,
		});

		// 自プレイヤーの位置は更新しない
		if (data.id === this.localPlayerId) {
			console.warn('[updateRemotePlayer] Attempted to update local player, skipping');
			return;
		}

		const character = this.remotePlayers.get(data.id);
		if (!character) {
			console.warn('[updateRemotePlayer] Character not found:', data.id);
			return;
		}

		// 仕様: リモートプレイヤーの位置を更新
		// 注意: 位置の保存はanimateループで行う（lerp中の実際の描画位置を使用するため）
		// 修正日: 2025-12-14
		character.setPosition(data.positionX, data.positionY, data.positionZ);

		// Update online status
		character.setOnline(data.isOnline);

		// 仕様: トレード中状態を更新
		if (data.isTrading !== undefined) {
			character.setTrading(data.isTrading);
		}

		// FR-018: Update player data for info window
		this.remotePlayerData.set(data.id, data);
	}

	public removeRemotePlayer(playerId: string): void {

		// デバッグログ: removeRemotePlayer呼び出し内容を確認
		console.log('[removeRemotePlayer] Called with:', {
			playerId,
			localPlayerId: this.localPlayerId,
			isLocalPlayer: playerId === this.localPlayerId,
		});
		
		// 自プレイヤーは削除しない
		if (playerId === this.localPlayerId) {
			console.warn('[removeRemotePlayer] Attempted to remove local player, skipping');
			return;
		}

		const character = this.remotePlayers.get(playerId);
		if (character) {
			this.scene.remove(character.group);
			this.remotePlayers.delete(playerId);
			// FR-018: Remove player data for info window
			this.remotePlayerData.delete(playerId);
		}
	}

	// T018: Set player online/offline status with visual effects
	public setPlayerOnlineStatus(playerId: string, isOnline: boolean): void {
		const character = this.remotePlayers.get(playerId);
		if (!character) return;

		// Apply visual effects based on online status
		character.group.traverse((child) => {
			if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
				if (isOnline) {
					// Online: restore normal appearance
					child.material.opacity = 1.0;
					child.material.transparent = false;
				} else {
					// Offline: reduce opacity
					child.material.opacity = 0.7;
					child.material.transparent = true;
				}
			}
		});

		// Update player name sprite to show online/offline status
		character.setOnline(isOnline);
	}

	// FR-020: Get remote players map for checking existence
	public getRemotePlayers(): Map<string, Character> {
		return this.remotePlayers;
	}

	// FR-014: 表示中のプレイヤーIDリストを取得
	public getVisiblePlayerIds(): string[] {
		return Array.from(this.remotePlayers.keys());
	}

	// FR-017: Get remote player IDs for ping/pong
	public getRemotePlayerIds(): string[] {
		return Array.from(this.remotePlayers.keys());
	}

	// 指定されたプレイヤーIDがリモートプレイヤーとして存在するか確認
	public hasRemotePlayer(playerId: string): boolean {
		return this.remotePlayers.has(playerId);
	}

	// FR-017: Update remote player ping status and mark color
	public updateRemotePlayerPingStatus(playerId: string, responseTimeMs: number): void {
		const character = this.remotePlayers.get(playerId);
		if (!character) return;

		character.updatePingStatus(responseTimeMs);
	}

	// 仕様: プレイヤーのトレード中状態を更新
	public updatePlayerTradingStatus(playerId: string, isTrading: boolean): void {
		const character = this.remotePlayers.get(playerId);
		if (!character) return;

		character.setTrading(isTrading);

		// Update player data for info window
		const playerData = this.remotePlayerData.get(playerId);
		if (playerData) {
			playerData.isTrading = isTrading;
		}
	}

	// FR-017: Check all remote players for warning status (3+ seconds since last ping)
	public checkRemotePlayerWarnings(): void {
		for (const [playerId, character] of this.remotePlayers) {
			if (character.needsWarningColor()) {
				character.setWarningColor();
			}
		}
	}

	// Chunk management
	public loadChunk(data: ChunkData): void {
		const key = `${data.chunkX},${data.chunkZ}`;
		if (this.chunks.has(key)) return;

		const CHUNK_SIZE = 16;
		const group = new THREE.Group();
		group.position.set(data.chunkX * CHUNK_SIZE, 0, data.chunkZ * CHUNK_SIZE);

		// SC-013: Add grid helper for ground grid lines (character-demo+14-fishing準拠)
		const gridHelper = new THREE.GridHelper(CHUNK_SIZE, CHUNK_SIZE, 0x2a3a3a, 0x2a3a3a);
		gridHelper.position.set(CHUNK_SIZE / 2, 0.01, CHUNK_SIZE / 2); // Center in chunk, y=0.01 to avoid z-fighting
		group.add(gridHelper);

		// Check if terrainData is an array (new format) or object (old format)
		// 注意: 池・湖・農園プロットの生成はrenderChunk()で行うため、ここでは行わない
		if (Array.isArray(data.terrainData)) {
			// New format: terrainData is number[] (地形タイプ配列)
			// 地形メッシュの生成はrenderChunk()に委譲
		} else {
			// Old format: terrainData is { heightMap, version }
			const heightMap = data.terrainData.heightMap;
			if (heightMap && heightMap.length > 0) {
				const geometry = new THREE.PlaneGeometry(16, 16, 15, 15);
				const positions = geometry.attributes.position;

				for (let i = 0; i < positions.count; i++) {
					const x = Math.floor(i % 16);
					const z = Math.floor(i / 16);
					if (heightMap[x] && heightMap[x][z] !== undefined) {
						positions.setZ(i, heightMap[x][z] * 0.2);
					}
				}
				geometry.computeVertexNormals();

				const color = this.getBiomeColor(data.biome);
				const material = new THREE.MeshStandardMaterial({
					color,
					roughness: 0.8,
					flatShading: true,
				});

				const terrain = new THREE.Mesh(geometry, material);
				terrain.rotation.x = -Math.PI / 2;
				terrain.position.set(8, 0, 8);
				terrain.receiveShadow = true;
				group.add(terrain);
			}
		}

		// FR-010: Add environment objects from backend data (trees, flowers, etc.)
		if (data.environmentObjects && data.environmentObjects.length > 0) {
			const envRenderer = new ChunkEnvironmentRenderer();
			// heightMapを取得（terrainDataが配列形式の場合は仮の高さマップを使用）
			const heightMap: number[][] = [];
			if (Array.isArray(data.terrainData)) {
				// 仮の高さマップ（すべて8）
				for (let x = 0; x < CHUNK_SIZE; x++) {
					heightMap[x] = [];
					for (let z = 0; z < CHUNK_SIZE; z++) {
						heightMap[x][z] = 8;
					}
				}
			} else {
				// 旧形式のheightMapを使用
				for (let x = 0; x < CHUNK_SIZE; x++) {
					heightMap[x] = [];
					for (let z = 0; z < CHUNK_SIZE; z++) {
						heightMap[x][z] = data.terrainData.heightMap[x]?.[z] ?? 8;
					}
				}
			}
			envRenderer.addObjects(data.environmentObjects, data.chunkX, data.chunkZ, heightMap);
			group.add(envRenderer.getGroup());
		} else {
			// フォールバック: environmentObjectsがない場合はランダム生成
			addRandomEnvironmentEntities(this.scene, data.chunkX, data.chunkZ, 16);
		}

		this.scene.add(group);
		this.chunks.set(key, group);
	}

	private getBiomeColor(biome: string): number {
		switch (biome) {
			case 'forest': return 0x228b22;
			case 'plains': return 0x7cfc00;
			case 'desert': return 0xf4a460;
			case 'mountain': return 0x808080;
			case 'ocean': return 0x1e90ff;
			default: return 0x3d8c40;
		}
	}

	// Item management
	// 仕様: FR-030 ドロップアイテムの絵文字表現と拾得システム
	// 絵文字またはデフォルト絵文字（📦）で地面に表示
	public addDroppedItem(data: DroppedItemData): void {
		if (this.droppedItems.has(data.id)) return;

		const group = new THREE.Group();
		const baseY = data.positionY + 0.5;
		group.position.set(data.positionX, baseY, data.positionZ);
		group.userData = { type: 'droppedItem', data };

		// 仕様: ノクタコイン（currency）は3Dモデルを使用、それ以外は絵文字
		const isCurrency = data.itemType === 'currency';

		if (isCurrency) {
			// 仕様: ノクタコインは3Dモデルで表示
			const coinMesh = this.createCoinMesh();
			coinMesh.scale.set(0.8, 0.8, 0.8);
			group.add(coinMesh);
		} else {
			// 仕様: 小さな光る球体（視認性向上）
			const geometry = new THREE.SphereGeometry(0.15, 12, 12);
			const material = new THREE.MeshStandardMaterial({
				color: this.getItemColor(data.itemType),
				emissive: this.getItemColor(data.itemType),
				emissiveIntensity: 0.5,
				transparent: true,
				opacity: 0.6,
			});
			const sphere = new THREE.Mesh(geometry, material);
			sphere.castShadow = true;
			group.add(sphere);
		}

		// 仕様: クリック検出用の透明ヒットボックス（絵文字ラベルはCSS2DObjectでレイキャスト不可のため）
		const hitboxGeometry = new THREE.SphereGeometry(0.6, 8, 8);
		const hitboxMaterial = new THREE.MeshBasicMaterial({
			visible: false,
		});
		const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
		hitbox.position.set(0, 0.2, 0);
		group.add(hitbox);

		// 仕様: FR-030 絵文字ラベル（CSS2DObject）
		// ノクタコインは3Dモデルなので絵文字は表示しない
		const labelDiv = document.createElement('div');
		labelDiv.className = 'noctown-dropped-item-label';

		if (isCurrency) {
			// 仕様: ノクタコインは数量バッジのみ表示
			labelDiv.style.cssText = `
				pointer-events: none;
				user-select: none;
			`;
		} else {
			// emoji > imageUrl > デフォルト📦 の優先順位
			const displayEmoji = data.emoji ?? '📦';
			labelDiv.style.cssText = `
				font-size: 32px;
				text-shadow: 0 2px 4px rgba(0,0,0,0.5);
				pointer-events: none;
				user-select: none;
			`;
			labelDiv.textContent = displayEmoji;
		}

		// 仕様: 数量が2以上の場合は数量バッジを表示
		if (data.quantity > 1) {
			const quantityBadge = document.createElement('span');
			quantityBadge.style.cssText = `
				position: absolute;
				bottom: ${isCurrency ? '0px' : '-4px'};
				right: ${isCurrency ? '0px' : '-8px'};
				background: rgba(0,0,0,0.7);
				color: #fff;
				font-size: 12px;
				font-weight: bold;
				padding: 1px 4px;
				border-radius: 4px;
				min-width: 16px;
				text-align: center;
			`;
			quantityBadge.textContent = `x${data.quantity}`;
			labelDiv.style.position = 'relative';
			labelDiv.appendChild(quantityBadge);
		}

		const label = new CSS2DObject(labelDiv);
		label.position.set(0, isCurrency ? 0.5 : 0.3, 0);
		group.add(label);

		this.scene.add(group);
		this.droppedItems.set(data.id, group);
		this.droppedItemLabels.set(data.id, label);
		this.droppedItemBaseY.set(data.id, baseY);
	}

	public removeDroppedItem(itemId: string): void {
		const group = this.droppedItems.get(itemId);
		if (group) {
			this.scene.remove(group);
			this.droppedItems.delete(itemId);
		}
		// 仕様: CSS2DObjectのDOM要素を明示的に削除（シーンから削除しただけではDOMに残る）
		const label = this.droppedItemLabels.get(itemId);
		if (label && label.element && label.element.parentNode) {
			label.element.parentNode.removeChild(label.element);
		}
		this.droppedItemLabels.delete(itemId);
		this.droppedItemBaseY.delete(itemId);
	}

	public addPlacedItem(data: PlacedItemData): void {
		if (this.placedItems.has(data.id)) return;

		const group = new THREE.Group();
		group.position.set(data.positionX, data.positionY, data.positionZ);
		group.rotation.y = data.rotation;

		// 仕様: アイテムタイプまたはアイテム名に応じた専用メッシュを生成
		const itemObject = this.createPlacedItemMesh(data.itemType, data.itemName);
		// 仕様: 全ての子メッシュに影設定を適用（Groupの場合も対応）
		itemObject.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		});
		group.add(itemObject);

		group.userData = { type: 'placedItem', data };
		this.scene.add(group);
		this.placedItems.set(data.id, group);
	}

	// 仕様: 設置アイテムのタイプまたは名前に応じた専用メッシュを生成
	private createPlacedItemMesh(itemType: string, itemName?: string): THREE.Object3D {
		// 仕様: アイテム名による判定（特定アイテムは専用3Dモデル）
		if (itemName === 'ケーキ') {
			return this.createCakeMesh();
		}
		if (itemName === '宝箱') {
			return this.createTreasureChestMesh();
		}
		// 仕様: 違反緩和チケットの専用3Dモデル
		if (itemName === '違反緩和チケット') {
			return this.createTicketMesh();
		}

		switch (itemType) {
			case 'stone':
			case 'rock': {
				// 岩: 環境オブジェクトと同じDodecahedronGeometryを使用
				const rockGeo = new THREE.DodecahedronGeometry(0.5, 0);
				const rockMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.9 });
				const rock = new THREE.Mesh(rockGeo, rockMat);
				rock.position.y = 0.25;
				rock.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
				return rock;
			}
			case 'wood':
			case 'log': {
				// 仕様: 木材の3Dモデル（5枚の板が重なった状態）
				return this.createWoodMesh();
			}
			case 'axe': {
				// 仕様: 斧の3Dモデル
				return this.createAxeMesh();
			}
			case 'currency': {
				// 仕様: ノクタコインの3Dモデル
				return this.createCoinMesh();
			}
			case 'fishing_rod': {
				// 仕様: 釣り竿の3Dモデル
				return this.createFishingRodMesh();
			}
			default: {
				// デフォルト: 立方体
				const geometry = new THREE.BoxGeometry(1, 1, 1);
				const material = new THREE.MeshStandardMaterial({
					color: this.getItemColor(itemType),
					roughness: 0.6,
				});
				const mesh = new THREE.Mesh(geometry, material);
				mesh.position.y = 0.5;
				return mesh;
			}
		}
	}

	// 仕様: 斧の3Dモデル生成
	private createAxeMesh(): THREE.Group {
		const axeGroup = new THREE.Group();

		// マテリアル
		const woodMaterial = new THREE.MeshStandardMaterial({
			color: 0x8B5A2B,
			roughness: 0.8,
			metalness: 0.0,
		});
		const bladeMaterial = new THREE.MeshStandardMaterial({
			color: 0xb0b0b0,
			roughness: 0.4,
			metalness: 0.5,
		});
		const edgeMaterial = new THREE.MeshStandardMaterial({
			color: 0xe8e8e8,
			roughness: 0.2,
			metalness: 0.6,
		});

		// 柄
		const handleGeometry = new THREE.CylinderGeometry(0.03, 0.035, 0.9, 16);
		const handle = new THREE.Mesh(handleGeometry, woodMaterial);
		handle.castShadow = true;
		axeGroup.add(handle);

		// 斧頭（湾曲した刃先）
		const bladeShape = new THREE.Shape();
		bladeShape.moveTo(-0.03, -0.04);
		bladeShape.lineTo(-0.03, 0.04);
		bladeShape.lineTo(0.0, 0.07);
		bladeShape.lineTo(0.12, 0.11);
		bladeShape.quadraticCurveTo(0.22, 0.08, 0.24, 0.0);
		bladeShape.quadraticCurveTo(0.22, -0.08, 0.12, -0.11);
		bladeShape.lineTo(0.0, -0.07);
		bladeShape.lineTo(-0.03, -0.04);

		const bladeGeometry = new THREE.ExtrudeGeometry(bladeShape, {
			steps: 1,
			depth: 0.03,
			bevelEnabled: true,
			bevelThickness: 0.005,
			bevelSize: 0.005,
			bevelSegments: 2,
		});
		const axeBlade = new THREE.Mesh(bladeGeometry, bladeMaterial);
		axeBlade.position.set(0.03, 0.42, -0.015);
		axeBlade.castShadow = true;
		axeGroup.add(axeBlade);

		// 刃先の白いエッジ（湾曲）
		const edgeShape = new THREE.Shape();
		edgeShape.moveTo(0.12, 0.105);
		edgeShape.quadraticCurveTo(0.22, 0.075, 0.24, 0.0);
		edgeShape.quadraticCurveTo(0.22, -0.075, 0.12, -0.105);
		edgeShape.quadraticCurveTo(0.20, -0.065, 0.215, 0.0);
		edgeShape.quadraticCurveTo(0.20, 0.065, 0.12, 0.105);

		const edgeGeometry = new THREE.ExtrudeGeometry(edgeShape, {
			steps: 1,
			depth: 0.032,
			bevelEnabled: false,
		});
		const axeEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
		axeEdge.position.set(0.03, 0.42, -0.016);
		axeEdge.castShadow = true;
		axeGroup.add(axeEdge);

		// 柄と頭の接続部
		const collarGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.05, 16);
		const collar = new THREE.Mesh(collarGeometry, bladeMaterial);
		collar.position.set(0, 0.42, 0);
		axeGroup.add(collar);

		// 斧を横に倒す
		axeGroup.rotation.z = Math.PI / 2;
		axeGroup.rotation.x = -Math.PI / 2;
		axeGroup.rotation.y = 0.15;
		axeGroup.position.y = 0.06;

		return axeGroup;
	}

	// 仕様: 木目テクスチャをプロシージャル生成
	private createWoodTexture(width = 256, height = 256, seed = 12345): THREE.CanvasTexture {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d')!;

		// シード付き乱数生成器
		let currentSeed = seed;
		const seededRandom = () => {
			currentSeed = (currentSeed * 9301 + 49297) % 233280;
			return currentSeed / 233280;
		};

		// ベースカラー（明るい木材色）
		const baseColor = { r: 180, g: 130, b: 80 };
		const darkColor = { r: 120, g: 75, b: 40 };

		// グラデーション背景
		const gradient = ctx.createLinearGradient(0, 0, width, 0);
		gradient.addColorStop(0, `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`);
		gradient.addColorStop(0.5, `rgb(${baseColor.r + 20}, ${baseColor.g + 15}, ${baseColor.b + 10})`);
		gradient.addColorStop(1, `rgb(${baseColor.r - 10}, ${baseColor.g - 10}, ${baseColor.b - 5})`);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);

		// 木目の線を描画
		ctx.strokeStyle = `rgba(${darkColor.r}, ${darkColor.g}, ${darkColor.b}, 0.3)`;
		for (let i = 0; i < 40; i++) {
			const y = seededRandom() * height;
			const thickness = seededRandom() * 3 + 0.5;
			const waviness = seededRandom() * 8 + 2;
			const frequency = seededRandom() * 0.02 + 0.005;

			ctx.lineWidth = thickness;
			ctx.beginPath();
			ctx.moveTo(0, y);
			for (let x = 0; x < width; x += 2) {
				const yOffset = Math.sin(x * frequency) * waviness +
					Math.sin(x * frequency * 2.3) * (waviness * 0.5);
				ctx.lineTo(x, y + yOffset);
			}
			ctx.stroke();
		}

		// 節（ふし）を追加
		for (let i = 0; i < 1; i++) {
			const knotX = seededRandom() * width;
			const knotY = seededRandom() * height;
			const knotSize = seededRandom() * 12 + 6;

			const knotGradient = ctx.createRadialGradient(knotX, knotY, 0, knotX, knotY, knotSize);
			knotGradient.addColorStop(0, `rgba(${darkColor.r - 30}, ${darkColor.g - 30}, ${darkColor.b - 20}, 0.8)`);
			knotGradient.addColorStop(0.5, `rgba(${darkColor.r}, ${darkColor.g}, ${darkColor.b}, 0.5)`);
			knotGradient.addColorStop(1, 'rgba(0,0,0,0)');

			ctx.fillStyle = knotGradient;
			ctx.beginPath();
			ctx.ellipse(knotX, knotY, knotSize, knotSize * 0.7, 0, 0, Math.PI * 2);
			ctx.fill();
		}

		return new THREE.CanvasTexture(canvas);
	}

	// 仕様: 端面用テクスチャ（年輪）
	private createEndGrainTexture(size = 128, seed = 54321): THREE.CanvasTexture {
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d')!;

		let currentSeed = seed;
		const seededRandom = () => {
			currentSeed = (currentSeed * 9301 + 49297) % 233280;
			return currentSeed / 233280;
		};

		// ベース
		ctx.fillStyle = '#b8956a';
		ctx.fillRect(0, 0, size, size);

		const centerX = size / 2;
		const centerY = size / 2;

		// 年輪を描画
		for (let r = 3; r < size * 0.45; r += 2 + seededRandom() * 2) {
			const alpha = 0.2 + seededRandom() * 0.15;
			ctx.strokeStyle = `rgba(90, 55, 30, ${alpha})`;
			ctx.lineWidth = 0.5 + seededRandom() * 0.5;
			ctx.beginPath();
			ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
			ctx.stroke();
		}

		return new THREE.CanvasTexture(canvas);
	}

	// 仕様: 木材の3Dモデル生成（5枚の板が重なった状態）
	private createWoodMesh(): THREE.Group {
		const woodGroup = new THREE.Group();

		// シード付き乱数生成器
		let seed = 12345;
		const seededRandom = () => {
			seed = (seed * 9301 + 49297) % 233280;
			return seed / 233280;
		};

		const plankHeight = 0.06;
		const plankCount = 5;

		for (let i = 0; i < plankCount; i++) {
			// 各板で少し異なるテクスチャを生成
			const woodTexture = this.createWoodTexture(256, 256, 12345 + i * 1000);
			woodTexture.wrapS = THREE.RepeatWrapping;
			woodTexture.wrapT = THREE.RepeatWrapping;

			const endGrainTexture = this.createEndGrainTexture(128, 54321 + i * 500);

			const woodMaterial = new THREE.MeshStandardMaterial({
				map: woodTexture,
				roughness: 0.7,
				metalness: 0.0,
			});

			const endGrainMaterial = new THREE.MeshStandardMaterial({
				map: endGrainTexture,
				roughness: 0.8,
				metalness: 0.0,
			});

			// 板のジオメトリ（斧より少し小さめ）
			const geometry = new THREE.BoxGeometry(0.8, plankHeight, 0.5);

			// 各面にマテリアルを割り当て（右端面、左端面、上面、下面、前面、後面）
			const materials = [
				endGrainMaterial,
				endGrainMaterial,
				woodMaterial,
				woodMaterial,
				woodMaterial,
				woodMaterial,
			];

			const plank = new THREE.Mesh(geometry, materials);
			plank.castShadow = true;
			plank.receiveShadow = true;

			// 乱雑だけど少し揃えた配置
			const offsetX = (seededRandom() - 0.5) * 0.3;
			const offsetZ = (seededRandom() - 0.5) * 0.15;
			const rotY = (seededRandom() - 0.5) * 0.4;
			const rotZ = (seededRandom() - 0.5) * 0.08;
			const rotX = (seededRandom() - 0.5) * 0.06;

			const gap = 0.02;
			const heightVariation = seededRandom() * 0.03;
			plank.position.set(offsetX, plankHeight / 2 + i * (plankHeight + gap) + heightVariation, offsetZ);
			plank.rotation.set(rotX, rotY, rotZ);

			woodGroup.add(plank);
		}

		return woodGroup;
	}

	// 仕様: ノクタコインの3Dモデル生成
	private createCoinMesh(): THREE.Group {
		const coinGroup = new THREE.Group();

		// コインのサイズ（ドロップアイテム用に小さめ）
		const coinRadius = 0.3;
		const coinThickness = 0.03;
		const coinSegments = 32;

		// ゴールドマテリアル
		const goldMaterial = new THREE.MeshStandardMaterial({
			color: 0xffd700,
			metalness: 0.7,
			roughness: 0.25,
		});

		// エンボス用マテリアル（暗めのゴールド）
		const embossMaterial = new THREE.MeshBasicMaterial({
			color: 0x996633,
		});

		// コインの縁（円柱）
		const edgeGeometry = new THREE.CylinderGeometry(
			coinRadius, coinRadius, coinThickness, coinSegments
		);
		const coinEdge = new THREE.Mesh(edgeGeometry, goldMaterial);
		coinEdge.rotation.x = Math.PI / 2;
		coinEdge.castShadow = true;
		coinGroup.add(coinEdge);

		// 表面
		const faceGeometry = new THREE.CircleGeometry(coinRadius - 0.005, coinSegments);
		const frontFace = new THREE.Mesh(faceGeometry, goldMaterial);
		frontFace.position.z = coinThickness / 2 + 0.001;
		coinGroup.add(frontFace);

		// 裏面
		const backFace = new THREE.Mesh(faceGeometry, goldMaterial);
		backFace.position.z = -coinThickness / 2 - 0.001;
		backFace.rotation.y = Math.PI;
		coinGroup.add(backFace);

		// 外側リム（表）
		const rimGeometry = new THREE.RingGeometry(coinRadius - 0.045, coinRadius - 0.015, coinSegments);
		const rimFront = new THREE.Mesh(rimGeometry, embossMaterial);
		rimFront.position.z = coinThickness / 2 + 0.004;
		coinGroup.add(rimFront);

		// 外側リム（裏）
		const rimBack = new THREE.Mesh(rimGeometry, embossMaterial);
		rimBack.position.z = -coinThickness / 2 - 0.004;
		coinGroup.add(rimBack);

		// 内側リム（表）
		const innerRimGeometry = new THREE.RingGeometry(0.17, 0.19, coinSegments);
		const innerRimFront = new THREE.Mesh(innerRimGeometry, embossMaterial);
		innerRimFront.position.z = coinThickness / 2 + 0.004;
		coinGroup.add(innerRimFront);

		// 内側リム（裏）
		const innerRimBack = new THREE.Mesh(innerRimGeometry, embossMaterial);
		innerRimBack.position.z = -coinThickness / 2 - 0.004;
		coinGroup.add(innerRimBack);

		// 表面: 三日月
		const moonShape = new THREE.Shape();
		moonShape.absarc(0, 0, 0.11, 0, Math.PI * 2, false);
		const moonHole = new THREE.Path();
		moonHole.absarc(0.045, 0.025, 0.09, 0, Math.PI * 2, true);
		moonShape.holes.push(moonHole);

		const moonGeometry = new THREE.ShapeGeometry(moonShape);
		const moonMesh = new THREE.Mesh(moonGeometry, embossMaterial);
		moonMesh.position.set(-0.01, 0.01, coinThickness / 2 + 0.005);
		coinGroup.add(moonMesh);

		// 表面: 星を作成する関数
		const createStarShape = (outerRadius: number, innerRadius?: number): THREE.Shape => {
			const ir = innerRadius ?? outerRadius * 0.4;
			const shape = new THREE.Shape();
			const spikes = 5;
			for (let i = 0; i < spikes * 2; i++) {
				const radius = i % 2 === 0 ? outerRadius : ir;
				const angle = (i * Math.PI) / spikes - Math.PI / 2;
				const x = Math.cos(angle) * radius;
				const y = Math.sin(angle) * radius;
				if (i === 0) shape.moveTo(x, y);
				else shape.lineTo(x, y);
			}
			shape.closePath();
			return shape;
		};

		// 表面: 星の配置
		const starPositions = [
			{ x: 0.125, y: 0.1, size: 0.03 },
			{ x: -0.14, y: 0.11, size: 0.025 },
			{ x: 0.11, y: -0.1, size: 0.028 },
			{ x: -0.125, y: -0.11, size: 0.022 },
			{ x: 0.15, y: -0.01, size: 0.02 },
		];

		starPositions.forEach(({ x, y, size }) => {
			const starGeom = new THREE.ShapeGeometry(createStarShape(size));
			const star = new THREE.Mesh(starGeom, embossMaterial);
			star.position.set(x, y, coinThickness / 2 + 0.005);
			coinGroup.add(star);
		});

		// 裏面: Nシンボル
		const nShape = new THREE.Shape();
		nShape.moveTo(-0.075, -0.1);
		nShape.lineTo(-0.045, -0.1);
		nShape.lineTo(-0.045, 0.025);
		nShape.lineTo(0.045, -0.1);
		nShape.lineTo(0.075, -0.1);
		nShape.lineTo(0.075, 0.1);
		nShape.lineTo(0.045, 0.1);
		nShape.lineTo(0.045, -0.012);
		nShape.lineTo(-0.045, 0.1);
		nShape.lineTo(-0.075, 0.1);
		nShape.closePath();

		const nGeometry = new THREE.ShapeGeometry(nShape);
		const nMesh = new THREE.Mesh(nGeometry, embossMaterial);
		nMesh.position.z = -coinThickness / 2 - 0.005;
		nMesh.rotation.y = Math.PI;
		coinGroup.add(nMesh);

		// 裏面: Nを囲む円
		const nCircle = new THREE.Mesh(
			new THREE.RingGeometry(0.14, 0.16, 32),
			embossMaterial
		);
		nCircle.position.z = -coinThickness / 2 - 0.005;
		coinGroup.add(nCircle);

		// 裏面: 周囲のドット
		for (let i = 0; i < 12; i++) {
			const angle = (i / 12) * Math.PI * 2;
			const dotGeom = new THREE.CircleGeometry(0.012, 8);
			const dot = new THREE.Mesh(dotGeom, embossMaterial);
			dot.position.x = Math.cos(angle) * 0.21;
			dot.position.y = Math.sin(angle) * 0.21;
			dot.position.z = -coinThickness / 2 - 0.005;
			coinGroup.add(dot);
		}

		// 縁のノッチ
		const notchCount = 40;
		for (let i = 0; i < notchCount; i++) {
			const angle = (i / notchCount) * Math.PI * 2;
			const notchGeometry = new THREE.BoxGeometry(0.004, 0.004, coinThickness * 0.7);
			const notch = new THREE.Mesh(notchGeometry, embossMaterial);
			notch.position.x = Math.cos(angle) * coinRadius;
			notch.position.y = Math.sin(angle) * coinRadius;
			coinGroup.add(notch);
		}

		// コインを垂直に配置
		coinGroup.position.y = 0.15;

		return coinGroup;
	}

	// 仕様: ケーキの3Dモデル生成（軽量化版）
	private createCakeMesh(): THREE.Group {
		const cakeGroup = new THREE.Group();

		// 仕様: ドロップアイテム用のスケール（サイズ調整）
		const widthScale = 0.3;
		const heightScale = 1.2 * 0.6;

		// 仕様: マテリアル定義（MeshBasicMaterialで軽量化）
		const plateMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
		const cakeMat = new THREE.MeshBasicMaterial({ color: 0xfffef8 });
		const whippedCreamMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
		const strawberryMat = new THREE.MeshBasicMaterial({ color: 0xdc143c });
		const seedMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
		const leafMat = new THREE.MeshBasicMaterial({ color: 0x228b22, side: THREE.DoubleSide });
		const candleMat = new THREE.MeshBasicMaterial({ color: 0xffb6c1 });
		const wickMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
		const flameInnerMat = new THREE.MeshBasicMaterial({
			color: 0xffdd66,
			transparent: true,
			opacity: 0.4,
		});
		const flameOuterMat = new THREE.MeshBasicMaterial({
			color: 0xff6600,
			transparent: true,
			opacity: 0.2,
		});

		// 仕様: ケーキ皿（セグメント数24で滑らかに）
		const plateRadius = 3.2 * widthScale;
		const plateGeom = new THREE.CylinderGeometry(plateRadius, plateRadius * 0.94, 0.08, 24);
		const plate = new THREE.Mesh(plateGeom, plateMat);
		plate.position.y = 0.04;
		cakeGroup.add(plate);

		// 仕様: 白いケーキ本体（1段）
		const cakeRadius = 2.5 * widthScale;
		const cakeHeight = 1.2 * heightScale;
		const cakeGeom = new THREE.CylinderGeometry(cakeRadius, cakeRadius, cakeHeight, 24);
		const cake = new THREE.Mesh(cakeGeom, cakeMat);
		cake.position.y = 0.08 + cakeHeight / 2;
		cakeGroup.add(cake);

		const cakeTopY = 0.08 + cakeHeight;

		// 仕様: トップのホイップクリーム（2リング）
		for (let ring = 0; ring < 2; ring++) {
			const ringRadius = (0.3 + ring * 0.35) * widthScale * 2;
			const numCreams = 5 + ring * 4;
			for (let i = 0; i < numCreams; i++) {
				const angle = (i / numCreams) * Math.PI * 2;
				const creamGeom = new THREE.SphereGeometry(0.08 * widthScale * 2, 8, 8);
				const cream = new THREE.Mesh(creamGeom, whippedCreamMat);
				cream.position.x = Math.cos(angle) * ringRadius;
				cream.position.z = Math.sin(angle) * ringRadius;
				cream.position.y = cakeTopY + 0.03;
				cream.scale.y = 0.5;
				cakeGroup.add(cream);
			}
		}

		// 仕様: 側面のクリームデコレーション
		const numSideDecos = 8;
		for (let i = 0; i < numSideDecos; i++) {
			const angle = (i / numSideDecos) * Math.PI * 2;
			const decoGeom = new THREE.SphereGeometry(0.06, 8, 8);
			const deco = new THREE.Mesh(decoGeom, whippedCreamMat);
			deco.position.x = Math.cos(angle) * (cakeRadius + 0.01);
			deco.position.z = Math.sin(angle) * (cakeRadius + 0.01);
			deco.position.y = cakeTopY;
			deco.scale.set(1.1, 0.6, 0.6);
			deco.rotation.y = angle;
			cakeGroup.add(deco);
		}

		// 仕様: イチゴ作成関数（LatheGeometryでリアルな形状）
		const createStrawberry = (x: number, y: number, z: number, scale = 1): THREE.Group => {
			const strawberryGroup = new THREE.Group();
			const s = scale * 0.5 * 0.6;

			// イチゴ本体（LatheGeometryで滑らかな形状）
			const points: THREE.Vector2[] = [];
			const segments = 10;
			for (let i = 0; i <= segments; i++) {
				const t = i / segments;
				let radius;
				if (t < 0.1) {
					radius = 0.08 + t * 1.2;
				} else if (t < 0.7) {
					const tt = (t - 0.1) / 0.6;
					radius = 0.2 + Math.sin(tt * Math.PI) * 0.15;
				} else {
					const tt = (t - 0.7) / 0.3;
					radius = 0.2 * Math.cos(tt * Math.PI / 2);
				}
				points.push(new THREE.Vector2(radius * s, (0.5 - t) * 0.5 * s));
			}

			const strawberryGeom = new THREE.LatheGeometry(points, 12);
			const berry = new THREE.Mesh(strawberryGeom, strawberryMat);
			strawberryGroup.add(berry);

			// 仕様: 種（黄色い点々）
			const seedCount = 12;
			for (let i = 0; i < seedCount; i++) {
				const phi = Math.acos(1 - 2 * (i + 0.5) / seedCount);
				const theta = Math.PI * (1 + Math.sqrt(5)) * i;
				const seedRadius = 0.18 * s;
				const seedX = seedRadius * Math.sin(phi) * Math.cos(theta);
				const seedY = -0.05 * s + seedRadius * Math.cos(phi) * 0.8;
				const seedZ = seedRadius * Math.sin(phi) * Math.sin(theta);

				if (seedY < 0.18 * s && seedY > -0.18 * s) {
					const seedGeom = new THREE.SphereGeometry(0.006 * s, 4, 4);
					const seed = new THREE.Mesh(seedGeom, seedMat);
					seed.position.set(seedX, seedY, seedZ);
					seed.scale.y = 1.5;
					strawberryGroup.add(seed);
				}
			}

			// 仕様: ヘタ（5枚の葉）
			for (let i = 0; i < 5; i++) {
				const leafAngle = (i / 5) * Math.PI * 2;
				const leafShape = new THREE.Shape();
				leafShape.moveTo(0, 0);
				leafShape.quadraticCurveTo(0.025 * s, 0.04 * s, 0, 0.08 * s);
				leafShape.quadraticCurveTo(-0.025 * s, 0.04 * s, 0, 0);

				const leafGeom = new THREE.ShapeGeometry(leafShape);
				const leaf = new THREE.Mesh(leafGeom, leafMat);
				leaf.position.y = 0.18 * s;
				leaf.rotation.y = leafAngle;
				leaf.rotation.x = -0.5;
				strawberryGroup.add(leaf);
			}

			// 仕様: 茎
			const stemGeom = new THREE.CylinderGeometry(0.01 * s, 0.012 * s, 0.04 * s, 8);
			const stemMat = new THREE.MeshBasicMaterial({ color: 0x228b22 });
			const stem = new THREE.Mesh(stemGeom, stemMat);
			stem.position.y = 0.21 * s;
			strawberryGroup.add(stem);

			strawberryGroup.position.set(x, y, z);
			strawberryGroup.rotation.x = Math.PI; // 逆さま

			return strawberryGroup;
		};

		// 仕様: トップにイチゴを配置（外周5個 + 中央1個）
		const strawberryRadius = cakeRadius * 0.6;
		const strawberryHeight = 0.5 * 0.6 * 0.25;
		const baseY = cakeTopY + strawberryHeight + 0.05;
		const sinkAmount = baseY * 0.06;

		for (let i = 0; i < 5; i++) {
			const angle = (i / 5) * Math.PI * 2;
			const strawberry = createStrawberry(
				Math.cos(angle) * strawberryRadius,
				baseY - sinkAmount,
				Math.sin(angle) * strawberryRadius,
				1.0,
			);
			cakeGroup.add(strawberry);
		}

		// 中央の大きいイチゴ
		const centerBaseY = cakeTopY + strawberryHeight * 1.3 + 0.06;
		const centerSinkAmount = centerBaseY * 0.06;
		const centerStrawberry = createStrawberry(0, centerBaseY - centerSinkAmount, 0, 1.3);
		cakeGroup.add(centerStrawberry);

		// 仕様: キャンドル作成関数
		const createCandle = (x: number, z: number, height = 0.4): THREE.Group => {
			const candleGroup = new THREE.Group();
			const h = height;

			// キャンドル本体
			const candleGeom = new THREE.CylinderGeometry(0.03, 0.03, h, 12);
			const candle = new THREE.Mesh(candleGeom, candleMat);
			candle.position.y = h / 2;
			candleGroup.add(candle);

			// 芯
			const wickGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.05, 8);
			const wick = new THREE.Mesh(wickGeom, wickMat);
			wick.position.y = h + 0.025;
			candleGroup.add(wick);

			// 炎の内側（黄色・半透明）
			const flameInnerGeom = new THREE.SphereGeometry(0.025, 8, 8);
			const flameInner = new THREE.Mesh(flameInnerGeom, flameInnerMat);
			flameInner.scale.set(0.7, 2.0, 0.7);
			flameInner.position.y = h + 0.08;
			candleGroup.add(flameInner);

			// 炎の外側（オレンジ・半透明）
			const flameOuterGeom = new THREE.SphereGeometry(0.035, 8, 8);
			const flameOuter = new THREE.Mesh(flameOuterGeom, flameOuterMat);
			flameOuter.scale.set(1, 2.5, 1);
			flameOuter.position.y = h + 0.08;
			candleGroup.add(flameOuter);

			candleGroup.position.set(x, cakeTopY + 0.02, z);

			// アニメーション用データ
			candleGroup.userData.flameInner = flameInner;
			candleGroup.userData.flameOuter = flameOuter;
			candleGroup.userData.flameBaseY = h + 0.08;

			return candleGroup;
		};

		// 仕様: 5本のキャンドルをケーキの外周に配置
		const candleRadius = cakeRadius * 0.75;
		const candles: THREE.Group[] = [];
		for (let i = 0; i < 5; i++) {
			const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
			const candle = createCandle(
				Math.cos(angle) * candleRadius,
				Math.sin(angle) * candleRadius,
			);
			cakeGroup.add(candle);
			candles.push(candle);
		}

		// 仕様: 暗闘でローソクの明かりを楽しむためPointLight1つ追加（中央に配置）
		const candleLight = new THREE.PointLight(0xff9944, 0.15, 1.5);
		candleLight.position.set(0, cakeTopY + 0.5, 0);
		cakeGroup.add(candleLight);

		// 仕様: アニメーション用データ
		cakeGroup.userData.candles = candles;
		cakeGroup.userData.candleLight = candleLight;
		cakeGroup.userData.isCake = true;

		// 全体を少し上に配置
		cakeGroup.position.y = 0.1;

		return cakeGroup;
	}

	// 仕様: 宝箱の3Dモデル生成
	private createTreasureChestMesh(): THREE.Group {
		const chestGroup = new THREE.Group();

		// スケール（設置アイテム用に縮小）
		const scale = 0.25;

		// 寸法
		const W = 2.2 * scale;    // 幅
		const H = 1.1 * scale;    // 高さ（本体）
		const D = 1.5 * scale;    // 奥行き
		const T = 0.1 * scale;    // 壁の厚さ

		// マテリアル定義
		const woodMaterial = new THREE.MeshStandardMaterial({
			color: 0x6b3d1f,
			roughness: 0.75,
			metalness: 0.05,
		});

		const darkWoodMaterial = new THREE.MeshStandardMaterial({
			color: 0x4a2810,
			roughness: 0.8,
			metalness: 0.05,
		});

		const goldMaterial = new THREE.MeshStandardMaterial({
			color: 0xffd700,
			roughness: 0.25,
			metalness: 0.9,
		});

		const bronzeMaterial = new THREE.MeshStandardMaterial({
			color: 0xcd7f32,
			roughness: 0.4,
			metalness: 0.85,
		});

		const velvetMaterial = new THREE.MeshStandardMaterial({
			color: 0x8b0000,
			roughness: 0.95,
			metalness: 0,
		});

		// 本体（下部）
		const bodyGroup = new THREE.Group();

		// 底
		const bottom = new THREE.Mesh(
			new THREE.BoxGeometry(W, T, D),
			woodMaterial
		);
		bottom.position.y = T / 2;
		bottom.castShadow = true;
		bottom.receiveShadow = true;
		bodyGroup.add(bottom);

		// 前後左右の壁
		const frontGeom = new THREE.BoxGeometry(W - T * 2, H, T);
		const sideGeom = new THREE.BoxGeometry(T, H, D);

		const front = new THREE.Mesh(frontGeom, woodMaterial);
		front.position.set(0, H / 2 + T, D / 2 - T / 2);
		front.castShadow = true;
		bodyGroup.add(front);

		const back = new THREE.Mesh(frontGeom, woodMaterial);
		back.position.set(0, H / 2 + T, -D / 2 + T / 2);
		back.castShadow = true;
		bodyGroup.add(back);

		const left = new THREE.Mesh(sideGeom, woodMaterial);
		left.position.set(-W / 2 + T / 2, H / 2 + T, 0);
		left.castShadow = true;
		bodyGroup.add(left);

		const right = new THREE.Mesh(sideGeom, woodMaterial);
		right.position.set(W / 2 - T / 2, H / 2 + T, 0);
		right.castShadow = true;
		bodyGroup.add(right);

		// 内部のベルベット
		const innerFloor = new THREE.Mesh(
			new THREE.BoxGeometry(W - T * 2, 0.02 * scale, D - T * 2),
			velvetMaterial
		);
		innerFloor.position.y = T + 0.01 * scale;
		bodyGroup.add(innerFloor);

		// 金属の装飾バンド
		const createBand = (y: number, bandScale = 1): THREE.Mesh => {
			const band = new THREE.Mesh(
				new THREE.BoxGeometry(W + 0.08 * scale, 0.15 * scale * bandScale, D + 0.08 * scale),
				goldMaterial
			);
			band.position.y = y;
			band.castShadow = true;
			return band;
		};
		bodyGroup.add(createBand(0.12 * scale));
		bodyGroup.add(createBand(H + T - 0.08 * scale));

		// コーナー装飾
		const cornerGeo = new THREE.CylinderGeometry(0.08 * scale, 0.1 * scale, H + 0.1 * scale, 8);
		[[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([x, z]) => {
			const corner = new THREE.Mesh(cornerGeo, bronzeMaterial);
			corner.position.set(x * (W / 2 + 0.02 * scale), H / 2 + T, z * (D / 2 + 0.02 * scale));
			corner.castShadow = true;
			bodyGroup.add(corner);
		});

		// 足
		const footGeo = new THREE.SphereGeometry(0.1 * scale, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
		[[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([x, z]) => {
			const foot = new THREE.Mesh(footGeo, bronzeMaterial);
			foot.position.set(x * (W / 2 - 0.15 * scale), 0, z * (D / 2 - 0.15 * scale));
			foot.castShadow = true;
			bodyGroup.add(foot);
		});

		chestGroup.add(bodyGroup);

		// 蓋
		const lidPivot = new THREE.Group();
		const lidGroup = new THREE.Group();

		// 蓋本体（半円筒）
		const lidRadius = D / 2;
		const lidCurve = new THREE.Mesh(
			new THREE.CylinderGeometry(lidRadius, lidRadius, W, 32, 1, false, 0, Math.PI),
			woodMaterial
		);
		lidCurve.rotation.z = Math.PI / 2;
		lidCurve.position.y = 0;
		lidCurve.castShadow = true;
		lidGroup.add(lidCurve);

		// 蓋の側面
		const lidSideShape = new THREE.Shape();
		lidSideShape.absarc(0, 0, lidRadius, 0, Math.PI, false);
		const lidSideGeo = new THREE.ExtrudeGeometry(lidSideShape, { depth: T, bevelEnabled: false });

		const lidLeft = new THREE.Mesh(lidSideGeo, darkWoodMaterial);
		lidLeft.rotation.y = -Math.PI / 2;
		lidLeft.position.set(-W / 2, 0, 0);
		lidLeft.castShadow = true;
		lidGroup.add(lidLeft);

		const lidRight = new THREE.Mesh(lidSideGeo, darkWoodMaterial);
		lidRight.rotation.y = -Math.PI / 2;
		lidRight.position.set(W / 2 + T, 0, 0);
		lidRight.castShadow = true;
		lidGroup.add(lidRight);

		// 蓋の装飾バンド
		const lidBandGeo = new THREE.CylinderGeometry(
			lidRadius + 0.06 * scale, lidRadius + 0.06 * scale, 0.12 * scale, 32, 1, false, 0, Math.PI
		);
		[-W / 2 + 0.2 * scale, 0, W / 2 - 0.2 * scale].forEach(x => {
			const band = new THREE.Mesh(lidBandGeo, goldMaterial);
			band.rotation.z = Math.PI / 2;
			band.position.set(x, 0, 0);
			band.castShadow = true;
			lidGroup.add(band);
		});

		// 蓋をピボットに配置（閉じた状態）
		lidGroup.position.z = D / 2;
		lidPivot.position.set(0, H + T, -D / 2);
		lidPivot.name = 'lidPivot'; // 仕様: アニメーション用に名前を設定
		lidPivot.add(lidGroup);
		chestGroup.add(lidPivot);

		// 錠前
		const lockGroup = new THREE.Group();

		const lockPlate = new THREE.Mesh(
			new THREE.BoxGeometry(0.4 * scale, 0.5 * scale, 0.08 * scale),
			goldMaterial
		);
		lockPlate.castShadow = true;
		lockGroup.add(lockPlate);

		// 装飾リング
		const ringGeo = new THREE.TorusGeometry(0.12 * scale, 0.025 * scale, 16, 32);
		const ring = new THREE.Mesh(ringGeo, bronzeMaterial);
		ring.position.z = 0.04 * scale;
		ring.castShadow = true;
		lockGroup.add(ring);

		// 鍵穴
		const keyholeOuter = new THREE.Mesh(
			new THREE.CircleGeometry(0.06 * scale, 16),
			new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.3 })
		);
		keyholeOuter.position.z = 0.041 * scale;
		lockGroup.add(keyholeOuter);

		const keyholeSlot = new THREE.Mesh(
			new THREE.PlaneGeometry(0.025 * scale, 0.08 * scale),
			new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.3 })
		);
		keyholeSlot.position.set(0, -0.06 * scale, 0.041 * scale);
		lockGroup.add(keyholeSlot);

		lockGroup.position.set(0, H / 2 + 0.35 * scale, D / 2 + 0.04 * scale);
		chestGroup.add(lockGroup);

		// 全体を少し上に配置
		chestGroup.position.y = 0.05;

		return chestGroup;
	}

	// 仕様: 違反緩和チケットの3Dモデル生成
	// FR-XXX: 黄色いチケット型アイテム、ミシン目とバーコード付き
	private createTicketMesh(): THREE.Group {
		const ticketGroup = new THREE.Group();

		// スケール（設置アイテム用に縮小）
		const scale = 0.15;

		// 寸法（ユーザー提供モデルを参考）
		const width = 4 * scale;
		const height = 1.8 * scale;
		const depth = 0.08 * scale;
		const notchRadius = 0.15 * scale;
		const notchPosition = width * 0.7;

		// マテリアル定義
		const ticketMaterial = new THREE.MeshStandardMaterial({
			color: 0xffd54f, // 黄色
			roughness: 0.3,
			metalness: 0.1,
		});

		const goldMaterial = new THREE.MeshStandardMaterial({
			color: 0xffb300, // ゴールドアクセント
			roughness: 0.2,
			metalness: 0.8,
		});

		const stubMaterial = new THREE.MeshStandardMaterial({
			color: 0xffa000, // オレンジゴールド
			roughness: 0.4,
			metalness: 0.3,
		});

		const barcodeMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a, // 黒
			roughness: 0.9,
		});

		// チケット本体（ミシン目付きの形状をExtrudeGeometryで作成）
		const ticketShape = new THREE.Shape();
		ticketShape.moveTo(0, 0);
		ticketShape.lineTo(notchPosition - notchRadius, 0);
		ticketShape.absarc(notchPosition, 0, notchRadius, Math.PI, 0, true);
		ticketShape.lineTo(width, 0);
		ticketShape.lineTo(width, height);
		ticketShape.lineTo(notchPosition + notchRadius, height);
		ticketShape.absarc(notchPosition, height, notchRadius, 0, Math.PI, true);
		ticketShape.lineTo(0, height);
		ticketShape.lineTo(0, 0);

		const extrudeSettings = {
			steps: 1,
			depth: depth,
			bevelEnabled: true,
			bevelThickness: 0.02 * scale,
			bevelSize: 0.02 * scale,
			bevelSegments: 2,
		};

		const ticketGeometry = new THREE.ExtrudeGeometry(ticketShape, extrudeSettings);
		ticketGeometry.center();
		const ticket = new THREE.Mesh(ticketGeometry, ticketMaterial);
		ticket.castShadow = true;
		ticket.receiveShadow = true;
		ticketGroup.add(ticket);

		// ゴールドのアクセントライン（上部）
		const accentGeometry = new THREE.BoxGeometry(2.5 * scale, 0.05 * scale, depth * 1.3);
		const accentLine1 = new THREE.Mesh(accentGeometry, goldMaterial);
		accentLine1.position.set(-0.35 * scale, 0.5 * scale, 0);
		accentLine1.castShadow = true;
		ticketGroup.add(accentLine1);

		// ゴールドのアクセントライン（下部）
		const accentLine2 = new THREE.Mesh(accentGeometry, goldMaterial);
		accentLine2.position.set(-0.35 * scale, -0.5 * scale, 0);
		accentLine2.castShadow = true;
		ticketGroup.add(accentLine2);

		// スタブ部分の装飾（右側）
		const stubGeometry = new THREE.BoxGeometry(0.6 * scale, 1.2 * scale, depth * 1.3);
		const stubDeco = new THREE.Mesh(stubGeometry, stubMaterial);
		stubDeco.position.set(1.5 * scale, 0, 0);
		stubDeco.castShadow = true;
		ticketGroup.add(stubDeco);

		// バーコード（右側スタブエリア）
		for (let i = 0; i < 8; i++) {
			const barWidth = (0.02 + Math.random() * 0.03) * scale;
			const barGeometry = new THREE.BoxGeometry(barWidth, 0.3 * scale, 0.01 * scale);
			const bar = new THREE.Mesh(barGeometry, barcodeMaterial);
			bar.position.set((1.3 + i * 0.045) * scale, -0.15 * scale, depth * 0.6);
			ticketGroup.add(bar);
		}

		// シリアルナンバー風のドット（左側）
		const serialDots = [
			[1, 1, 0, 1, 1, 0, 1, 0],
			[1, 0, 1, 0, 1, 1, 0, 1],
		];
		serialDots.forEach((row, rowIndex) => {
			row.forEach((val, colIndex) => {
				if (val) {
					const dotGeo = new THREE.BoxGeometry(0.03 * scale, 0.03 * scale, 0.01 * scale);
					const dot = new THREE.Mesh(dotGeo, barcodeMaterial);
					dot.position.set(
						(-0.8 + colIndex * 0.06) * scale,
						(0.1 - rowIndex * 0.06) * scale,
						depth * 0.6
					);
					ticketGroup.add(dot);
				}
			});
		});

		// 裏面のバーコード（対称配置）
		for (let i = 0; i < 8; i++) {
			const barWidth = (0.02 + Math.random() * 0.03) * scale;
			const barGeometry = new THREE.BoxGeometry(barWidth, 0.3 * scale, 0.01 * scale);
			const bar = new THREE.Mesh(barGeometry, barcodeMaterial);
			bar.position.set((1.3 + i * 0.045) * scale, -0.15 * scale, -depth * 0.6);
			ticketGroup.add(bar);
		}

		// チケットを横に寝かせて配置（地面に置いた状態）
		ticketGroup.rotation.x = -Math.PI / 2;
		ticketGroup.position.y = depth + 0.02;

		return ticketGroup;
	}

	// 仕様: 釣り竿の3Dモデル生成
	private createFishingRodMesh(): THREE.Group {
		const rodGroup = new THREE.Group();

		// スケール（設置アイテム用に縮小）
		const scale = 0.25;

		// マテリアル定義
		const carbonMaterial = new THREE.MeshStandardMaterial({
			color: 0x2c3e50,
			metalness: 0.3,
			roughness: 0.4,
		});

		const corkMaterial = new THREE.MeshStandardMaterial({
			color: 0xd4a574,
			roughness: 0.9,
			metalness: 0.0,
		});

		const metalMaterial = new THREE.MeshStandardMaterial({
			color: 0xc0c0c0,
			metalness: 0.8,
			roughness: 0.2,
		});

		const goldMaterial = new THREE.MeshStandardMaterial({
			color: 0xffd700,
			metalness: 0.9,
			roughness: 0.1,
		});

		const lineMaterial = new THREE.MeshBasicMaterial({
			color: 0x00ffff,
			transparent: true,
			opacity: 0.7,
		});

		// ロッド本体（テーパー形状）
		const rodSegments = 12;
		const rodLength = 4;

		for (let i = 0; i < rodSegments; i++) {
			const t = i / rodSegments;
			const radius = 0.03 * (1 - t * 0.7);
			const segmentLength = rodLength / rodSegments;

			const segmentGeo = new THREE.CylinderGeometry(
				radius * 0.9 * scale, radius * scale, segmentLength * scale, 8
			);
			const segment = new THREE.Mesh(segmentGeo, carbonMaterial);
			segment.position.x = t * rodLength * scale + segmentLength * scale / 2;
			segment.rotation.z = -Math.PI / 2;
			segment.castShadow = true;
			rodGroup.add(segment);
		}

		// コルクグリップ
		const gripLength = 0.5 * scale;
		const gripGeo = new THREE.CylinderGeometry(0.045 * scale, 0.04 * scale, gripLength, 8);
		const grip = new THREE.Mesh(gripGeo, corkMaterial);
		grip.position.x = -gripLength / 2;
		grip.rotation.z = -Math.PI / 2;
		grip.castShadow = true;
		rodGroup.add(grip);

		// リアグリップ
		const rearGripGeo = new THREE.CylinderGeometry(0.035 * scale, 0.04 * scale, 0.25 * scale, 8);
		const rearGrip = new THREE.Mesh(rearGripGeo, corkMaterial);
		rearGrip.position.x = -gripLength - 0.15 * scale;
		rearGrip.rotation.z = -Math.PI / 2;
		rearGrip.castShadow = true;
		rodGroup.add(rearGrip);

		// エンドキャップ
		const endCapGeo = new THREE.SphereGeometry(0.04 * scale, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
		const endCap = new THREE.Mesh(endCapGeo, metalMaterial);
		endCap.position.x = -gripLength - 0.27 * scale;
		endCap.rotation.z = Math.PI / 2;
		rodGroup.add(endCap);

		// リールシート
		const reelSeatGeo = new THREE.CylinderGeometry(0.038 * scale, 0.038 * scale, 0.15 * scale, 8);
		const reelSeat = new THREE.Mesh(reelSeatGeo, metalMaterial);
		reelSeat.position.x = 0.1 * scale;
		reelSeat.rotation.z = -Math.PI / 2;
		rodGroup.add(reelSeat);

		// リール本体
		const reelGroup = new THREE.Group();

		const reelBodyGeo = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.04 * scale, 16);
		const reelBody = new THREE.Mesh(reelBodyGeo, metalMaterial);
		reelBody.rotation.x = Math.PI / 2;
		reelGroup.add(reelBody);

		const spoolGeo = new THREE.CylinderGeometry(0.06 * scale, 0.06 * scale, 0.035 * scale, 16);
		const spool = new THREE.Mesh(spoolGeo, new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			metalness: 0.5,
			roughness: 0.3,
		}));
		spool.rotation.x = Math.PI / 2;
		reelGroup.add(spool);

		const handleArmGeo = new THREE.CylinderGeometry(0.008 * scale, 0.008 * scale, 0.08 * scale, 8);
		const handleArm = new THREE.Mesh(handleArmGeo, metalMaterial);
		handleArm.position.set(0, 0.06 * scale, 0);
		handleArm.rotation.x = Math.PI / 2;
		reelGroup.add(handleArm);

		const handleKnobGeo = new THREE.SphereGeometry(0.015 * scale, 8, 8);
		const handleKnob = new THREE.Mesh(handleKnobGeo, corkMaterial);
		handleKnob.position.set(0, 0.06 * scale, 0.045 * scale);
		reelGroup.add(handleKnob);

		reelGroup.position.set(0.1 * scale, -0.09 * scale, 0);
		rodGroup.add(reelGroup);

		// ガイド（ラインを通すリング）
		const guidePositions = [0.3, 0.7, 1.2, 1.8, 2.5, 3.2, 3.8];
		guidePositions.forEach((pos, i) => {
			const guideScale = 1 - (i / guidePositions.length) * 0.6;

			const frameGeo = new THREE.TorusGeometry(0.025 * guideScale * scale, 0.003 * scale, 4, 8);
			const frame = new THREE.Mesh(frameGeo, goldMaterial);
			frame.position.set(pos * scale, 0.04 * guideScale * scale, 0);
			frame.rotation.y = Math.PI / 2;
			rodGroup.add(frame);

			const legGeo = new THREE.CylinderGeometry(0.003 * scale, 0.003 * scale, 0.03 * guideScale * scale, 4);
			const leg = new THREE.Mesh(legGeo, metalMaterial);
			leg.position.set(pos * scale, 0.02 * guideScale * scale, 0);
			rodGroup.add(leg);
		});

		// トップガイド
		const topGuideGeo = new THREE.TorusGeometry(0.008 * scale, 0.002 * scale, 4, 8);
		const topGuide = new THREE.Mesh(topGuideGeo, goldMaterial);
		topGuide.position.set(rodLength * scale, 0.015 * scale, 0);
		topGuide.rotation.y = Math.PI / 2;
		rodGroup.add(topGuide);

		// 釣り糸
		const linePoints: THREE.Vector3[] = [];
		linePoints.push(new THREE.Vector3(0.1 * scale, -0.09 * scale, 0.04 * scale));
		guidePositions.forEach((pos, i) => {
			const guideScale = 1 - (i / guidePositions.length) * 0.6;
			linePoints.push(new THREE.Vector3(pos * scale, 0.04 * guideScale * scale + 0.025 * guideScale * scale, 0));
		});
		linePoints.push(new THREE.Vector3(rodLength * scale, 0.023 * scale, 0));

		const lineExtension = 0.3;
		linePoints.push(new THREE.Vector3(rodLength * scale + lineExtension, 0.02 * scale, 0));

		const lineCurve = new THREE.CatmullRomCurve3(linePoints);
		const lineGeo = new THREE.TubeGeometry(lineCurve, 32, 0.002 * scale, 4, false);
		const line = new THREE.Mesh(lineGeo, lineMaterial);
		rodGroup.add(line);

		// 針（フック）
		const hookCurvePoints = [
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(0.03 * scale, -0.01 * scale, 0),
			new THREE.Vector3(0.05 * scale, -0.03 * scale, 0),
			new THREE.Vector3(0.04 * scale, -0.05 * scale, 0),
			new THREE.Vector3(0.02 * scale, -0.04 * scale, 0),
		];
		const hookCurve = new THREE.CatmullRomCurve3(hookCurvePoints);
		const hookGeo = new THREE.TubeGeometry(hookCurve, 16, 0.002 * scale, 4, false);
		const hook = new THREE.Mesh(hookGeo, metalMaterial);
		hook.position.set(rodLength * scale + lineExtension, 0.02 * scale, 0);
		rodGroup.add(hook);

		// 地面に横たわる配置
		rodGroup.rotation.y = 0.3;
		rodGroup.position.y = 0.05;

		return rodGroup;
	}

	public removePlacedItem(itemId: string): void {
		const group = this.placedItems.get(itemId);
		if (group) {
			this.scene.remove(group);
			this.placedItems.delete(itemId);
		}
	}

	public clearItems(): void {
		this.droppedItems.forEach((group) => this.scene.remove(group));
		this.droppedItems.clear();
		// 仕様: CSS2DObjectのDOM要素を明示的に削除
		this.droppedItemLabels.forEach((label) => {
			if (label.element && label.element.parentNode) {
				label.element.parentNode.removeChild(label.element);
			}
		});
		this.droppedItemLabels.clear();
		this.droppedItemBaseY.clear();
		this.placedItems.forEach((group) => this.scene.remove(group));
		this.placedItems.clear();
	}

	// 仕様: FR-030 プレイヤー近くのドロップアイテムを取得（拾得範囲: 半径2マス）
	public getNearestDroppedItem(maxDistance: number = 2): DroppedItemData | null {
		if (!this.localPlayer) return null;

		const playerPos = this.localPlayer.getPosition();
		let nearestItem: DroppedItemData | null = null;
		let nearestDistance = maxDistance;

		for (const [itemId, group] of this.droppedItems) {
			const dx = group.position.x - playerPos.x;
			const dz = group.position.z - playerPos.z;
			const distance = Math.sqrt(dx * dx + dz * dz);

			if (distance < nearestDistance) {
				nearestDistance = distance;
				const userData = group.userData as { type: string; data: DroppedItemData };
				if (userData && userData.data) {
					nearestItem = userData.data;
				}
			}
		}

		return nearestItem;
	}

	// 仕様: FR-030 拾得範囲内にドロップアイテムがあるかチェック
	public hasNearbyDroppedItem(maxDistance: number = 2): boolean {
		return this.getNearestDroppedItem(maxDistance) !== null;
	}

	private getItemColor(type: string): number {
		switch (type) {
			case 'tool': return 0x8b4513;
			case 'skin': return 0xff69b4;
			case 'placeable': return 0xffa500;
			case 'agent': return 0x00ff00;
			case 'seed': return 0x32cd32;
			case 'feed': return 0xffd700;
			default: return 0xc0c0c0;
		}
	}

	public getLocalPlayerPosition(): { x: number; y: number; z: number } | null {
		if (!this.localPlayer) return null;
		// Return Character position
		const pos = this.localPlayer.getPosition();
		return {
			x: pos.x,
			y: pos.y,
			z: pos.z,
		};
	}

	// 仕様: ローカルプレイヤーのIDを取得
	public getLocalPlayerId(): string | null {
		return this.localPlayerId;
	}

	// NPC management
	public addNpc(data: NpcData): void {
		if (this.npcs.has(data.id)) return;

		const group = new THREE.Group();
		group.position.set(data.positionX, data.positionY, data.positionZ);

		// Create NPC body (slightly different color from players - purple tint)
		const geometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16);
		const material = new THREE.MeshStandardMaterial({
			color: 0x9966cc, // Purple for NPCs
			roughness: 0.5,
		});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.y = 1;
		mesh.castShadow = true;
		group.add(mesh);

		// Add quest marker above NPC
		const markerGeometry = new THREE.ConeGeometry(0.3, 0.6, 4);
		const markerMaterial = new THREE.MeshStandardMaterial({
			color: 0xffcc00,
			emissive: 0xffcc00,
			emissiveIntensity: 0.5,
		});
		const marker = new THREE.Mesh(markerGeometry, markerMaterial);
		marker.position.y = 2.8;
		marker.rotation.x = Math.PI; // Point down
		group.add(marker);

		group.userData = { type: 'npc', data };
		this.scene.add(group);
		this.npcs.set(data.id, group);

		// Create name label
		this.createNpcLabel(data.id, data.username, group.position);
	}

	public removeNpc(npcId: string): void {
		const group = this.npcs.get(npcId);
		if (group) {
			this.scene.remove(group);
			this.npcs.delete(npcId);
		}

		const label = this.npcLabels.get(npcId);
		if (label) {
			this.scene.remove(label);
			this.npcLabels.delete(npcId);
		}
	}

	public clearNpcs(): void {
		this.npcs.forEach((group) => this.scene.remove(group));
		this.npcs.clear();
		this.npcLabels.forEach((label) => this.scene.remove(label));
		this.npcLabels.clear();
	}

	private createNpcLabel(npcId: string, username: string, position: THREE.Vector3): void {
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (!context) return;

		canvas.width = 256;
		canvas.height = 64;
		context.fillStyle = 'rgba(102, 51, 153, 0.7)'; // Purple background for NPCs
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.font = 'bold 24px sans-serif';
		context.fillStyle = 'white';
		context.textAlign = 'center';
		context.fillText(username, canvas.width / 2, canvas.height / 2 + 8);

		const texture = new THREE.CanvasTexture(canvas);
		const material = new THREE.SpriteMaterial({ map: texture });
		const sprite = new THREE.Sprite(material);
		sprite.scale.set(4, 1, 1);
		sprite.position.copy(position);
		sprite.position.y += 3.5;
		this.scene.add(sprite);
		this.npcLabels.set(npcId, sprite);
	}

	public getNpcAt(x: number, z: number, radius: number = 2): NpcData | null {
		for (const [, group] of this.npcs) {
			const dx = group.position.x - x;
			const dz = group.position.z - z;
			const distance = Math.sqrt(dx * dx + dz * dz);
			if (distance <= radius) {
				return group.userData.data as NpcData;
			}
		}
		return null;
	}

	// Input handling (WASD removed, arrow keys only)
	public getMovementInput(): { x: number; z: number; rotation: number } {
		let x = 0;
		let z = 0;

		if (this.keys.has('ArrowUp')) z -= 1;
		if (this.keys.has('ArrowDown')) z += 1;
		if (this.keys.has('ArrowLeft')) x -= 1;
		if (this.keys.has('ArrowRight')) x += 1;

		// Fix: Match character-demo+1-emotion.html rotation calculation (line 356)
		// this.targetRotation = Math.atan2(moveDir.x, moveDir.z);
		const rotation = Math.atan2(x, z);
		return { x, z, rotation };
	}

	public isMoving(): boolean {
		return this.keys.has('ArrowUp') || this.keys.has('ArrowDown') ||
			this.keys.has('ArrowLeft') || this.keys.has('ArrowRight');
	}

	// FR-016: Unload all chunks for full reload
	public unloadAllChunks(): void {
		for (const [key, group] of this.chunks) {
			// Dispose of all meshes in the chunk group
			group.traverse((obj) => {
				if (obj instanceof THREE.Mesh) {
					obj.geometry.dispose();
					if (obj.material instanceof THREE.Material) {
						obj.material.dispose();
					} else if (Array.isArray(obj.material)) {
						obj.material.forEach(m => m.dispose());
					}
				}
			});
			this.scene.remove(group);
		}
		this.chunks.clear();
	}

	// FR-016: Remove all remote players for full reload
	public removeAllRemotePlayers(): void {
		for (const [playerId, character] of this.remotePlayers) {
			this.scene.remove(character.group);
		}
		this.remotePlayers.clear();
		this.remotePlayerLastPos.clear();
		// FR-018: Clear player data for info window
		this.remotePlayerData.clear();
	}

	// FR-018: Get clicked player ID using Raycaster (supports both mouse and touch events)
	public getClickedPlayerId(event: MouseEvent | TouchEvent): string | null {
		// Convert mouse/touch coordinates to normalized device coordinates
		const rect = this.renderer.domElement.getBoundingClientRect();

		let clientX: number;
		let clientY: number;

		if ('touches' in event || 'changedTouches' in event) {
			// TouchEvent - use changedTouches for touchend
			const touch = (event as TouchEvent).changedTouches[0] || (event as TouchEvent).touches[0];
			if (!touch) return null;
			clientX = touch.clientX;
			clientY = touch.clientY;
		} else {
			// MouseEvent
			clientX = (event as MouseEvent).clientX;
			clientY = (event as MouseEvent).clientY;
		}

		this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
		this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

		// Set up raycaster
		this.raycaster.setFromCamera(this.mouse, this.camera);

		// Collect all remote player groups
		const playerGroups: THREE.Object3D[] = [];
		for (const [playerId, character] of this.remotePlayers) {
			playerGroups.push(character.group);
		}

		// Perform intersection test (recursive: true to check child meshes)
		const intersects = this.raycaster.intersectObjects(playerGroups, true);

		if (intersects.length > 0) {
			// Find which player was clicked by traversing parent hierarchy
			const clickedObject = intersects[0].object;
			for (const [playerId, character] of this.remotePlayers) {
				if (this.isDescendantOf(clickedObject, character.group)) {
					return playerId;
				}
			}
		}
		return null;
	}

	// FR-018: Helper to check if an object is a descendant of another
	private isDescendantOf(child: THREE.Object3D, parent: THREE.Object3D): boolean {
		let current: THREE.Object3D | null = child;
		while (current) {
			if (current === parent) return true;
			current = current.parent;
		}
		return false;
	}

	// FR-018: Get remote player data for info window
	public getRemotePlayerData(playerId: string): PlayerData | null {
		return this.remotePlayerData.get(playerId) || null;
	}

	// FR-018: Get renderer DOM element for event listener attachment
	public getRendererDomElement(): HTMLCanvasElement {
		return this.renderer.domElement;
	}

	// FR-022: ペット追加
	public addPet(pet: PetInfo): void {
		if (this.petManager) {
			this.petManager.addPet(pet);
		}
	}

	// FR-022: ペット削除
	public removePet(petId: string): void {
		if (this.petManager) {
			this.petManager.removePet(petId);
		}
	}

	// FR-022: 複数ペット追加
	public addPets(pets: PetInfo[]): void {
		if (this.petManager) {
			this.petManager.addPets(pets);
		}
	}

	// FR-022: ペット情報取得
	public getPetData(petId: string): PetInfo | null {
		return this.petManager?.getPet(petId) ?? null;
	}

	// FR-022: 全ペットIDを取得
	public getAllPetIds(): string[] {
		return this.petManager?.getAllPetIds() ?? [];
	}

	// FR-022: クリック位置のペットを取得
	public getClickedPet(event: MouseEvent | TouchEvent): PetInfo | null {
		if (!this.petManager) return null;

		const rect = this.renderer.domElement.getBoundingClientRect();

		let clientX: number;
		let clientY: number;

		if ('touches' in event || 'changedTouches' in event) {
			const touch = (event as TouchEvent).changedTouches[0] || (event as TouchEvent).touches[0];
			if (!touch) return null;
			clientX = touch.clientX;
			clientY = touch.clientY;
		} else {
			clientX = (event as MouseEvent).clientX;
			clientY = (event as MouseEvent).clientY;
		}

		this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
		this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

		return this.petManager.getClickedPet(this.raycaster, this.camera, this.mouse);
	}

	// FR-022: 近くのペットを取得
	public getNearbyPet(x: number, z: number, radius: number = 2): PetInfo | null {
		return this.petManager?.getNearbyPet(x, z, radius) ?? null;
	}

	// FR-032: クリックされた設置アイテムを取得
	public getClickedPlacedItem(event: MouseEvent | TouchEvent): PlacedItemData | null {
		const rect = this.renderer.domElement.getBoundingClientRect();

		let clientX: number;
		let clientY: number;

		if ('touches' in event || 'changedTouches' in event) {
			const touch = (event as TouchEvent).changedTouches[0] || (event as TouchEvent).touches[0];
			if (!touch) return null;
			clientX = touch.clientX;
			clientY = touch.clientY;
		} else {
			clientX = (event as MouseEvent).clientX;
			clientY = (event as MouseEvent).clientY;
		}

		this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
		this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

		this.raycaster.setFromCamera(this.mouse, this.camera);

		// 設置アイテムのグループを収集
		const placedItemGroups: THREE.Object3D[] = [];
		for (const [, group] of this.placedItems) {
			placedItemGroups.push(group);
		}

		const intersects = this.raycaster.intersectObjects(placedItemGroups, true);

		if (intersects.length > 0) {
			// 親階層をたどって設置アイテムを特定
			let obj: THREE.Object3D | null = intersects[0].object;
			while (obj) {
				if (obj.userData?.type === 'placedItem' && obj.userData?.data) {
					return obj.userData.data as PlacedItemData;
				}
				obj = obj.parent;
			}
		}

		return null;
	}

	// FR-032: 設置アイテムを削除（回収時に使用）
	public removePlacedItemById(itemId: string): void {
		this.removePlacedItem(itemId);
	}

	// 仕様: 宝箱開封アニメーション
	// 蓋が開き、光のパーティクルが出現し、その後宝箱が消滅する
	public openTreasureChestWithAnimation(itemId: string): Promise<void> {
		return new Promise((resolve) => {
			const group = this.placedItems.get(itemId);
			if (!group) {
				resolve();
				return;
			}

			// lidPivotを探す
			const lidPivot = group.getObjectByName('lidPivot');
			if (!lidPivot) {
				// 宝箱でない場合は即座に削除
				this.removePlacedItem(itemId);
				resolve();
				return;
			}

			// アニメーション用パラメータ
			const duration = 800; // ミリ秒
			const startTime = performance.now();
			const maxRotation = -Math.PI * 0.7; // 約126度開く

			// パーティクル（光の粒）を作成
			const particles: THREE.Mesh[] = [];
			const particleMaterial = new THREE.MeshBasicMaterial({
				color: 0xffd700,
				transparent: true,
				opacity: 1,
			});

			for (let i = 0; i < 12; i++) {
				const particleGeo = new THREE.SphereGeometry(0.03, 8, 8);
				const particle = new THREE.Mesh(particleGeo, particleMaterial.clone());
				particle.position.copy(group.position);
				particle.position.y += 0.3;
				particle.userData.velocity = new THREE.Vector3(
					(Math.random() - 0.5) * 0.05,
					Math.random() * 0.08 + 0.02,
					(Math.random() - 0.5) * 0.05
				);
				particle.userData.life = 1.0;
				this.scene.add(particle);
				particles.push(particle);
			}

			// イージング関数（easeOutBack - 開いた後に少し戻る感じ）
			const easeOutBack = (t: number): number => {
				const c1 = 1.70158;
				const c3 = c1 + 1;
				return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
			};

			// アニメーションループ
			const animate = () => {
				const elapsed = performance.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);

				// 蓋を開く
				const easedProgress = easeOutBack(progress);
				lidPivot.rotation.x = maxRotation * easedProgress;

				// パーティクルを更新
				for (const particle of particles) {
					particle.position.add(particle.userData.velocity);
					particle.userData.velocity.y -= 0.002; // 重力
					particle.userData.life -= 0.02;
					(particle.material as THREE.MeshBasicMaterial).opacity = Math.max(0, particle.userData.life);
				}

				if (progress < 1) {
					requestAnimationFrame(animate);
				} else {
					// アニメーション完了後、少し待ってから消滅
					setTimeout(() => {
						// パーティクルを削除
						for (const particle of particles) {
							this.scene.remove(particle);
							particle.geometry.dispose();
							(particle.material as THREE.Material).dispose();
						}

						// 宝箱を削除
						this.removePlacedItem(itemId);
						resolve();
					}, 300);
				}
			};

			animate();
		});
	}

	// FR-032: クリックされたドロップアイテムを取得
	public getClickedDroppedItem(event: MouseEvent | TouchEvent): DroppedItemData | null {
		const rect = this.renderer.domElement.getBoundingClientRect();

		let clientX: number;
		let clientY: number;

		if ('touches' in event || 'changedTouches' in event) {
			const touch = (event as TouchEvent).changedTouches[0] || (event as TouchEvent).touches[0];
			if (!touch) return null;
			clientX = touch.clientX;
			clientY = touch.clientY;
		} else {
			clientX = (event as MouseEvent).clientX;
			clientY = (event as MouseEvent).clientY;
		}

		this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
		this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

		this.raycaster.setFromCamera(this.mouse, this.camera);

		// ドロップアイテムのグループを収集
		const droppedItemGroups: THREE.Object3D[] = [];
		for (const [, group] of this.droppedItems) {
			droppedItemGroups.push(group);
		}

		const intersects = this.raycaster.intersectObjects(droppedItemGroups, true);

		if (intersects.length > 0) {
			// 親階層をたどってドロップアイテムを特定
			let obj: THREE.Object3D | null = intersects[0].object;
			while (obj) {
				if (obj.userData?.type === 'droppedItem' && obj.userData?.data) {
					return obj.userData.data as DroppedItemData;
				}
				obj = obj.parent;
			}
		}

		return null;
	}

	// ============================================
	// 神社ワールド・ワープゲート機能
	// ============================================

	/**
	 * ワープ衝突コールバックを設定
	 * 仕様: T022 ゲート衝突時にwarpStartを送信するコールバック
	 */
	public setWarpCollisionCallback(callback: (gateId: string, targetWorldId: string | null) => void): void {
		this.onWarpCollision = callback;
	}

	/**
	 * ワープゲートを追加
	 * 仕様: T020 デフォルトワールドに神社へのゲート、神社に帰還ゲートを配置
	 */
	public addWarpGate(config: WarpGateConfig): void {
		if (this.warpGates.has(config.id)) {
			console.warn(`[Noctown Engine] WarpGate ${config.id} already exists`);
			return;
		}
		const gate = new WarpGate(config);
		this.warpGates.set(config.id, gate);
		this.scene.add(gate.group);
		console.log(`[Noctown Engine] Added warp gate: ${config.id} at`, config.position);
	}

	/**
	 * ワープゲートを削除
	 */
	public removeWarpGate(gateId: string): void {
		const gate = this.warpGates.get(gateId);
		if (gate) {
			this.scene.remove(gate.group);
			gate.dispose();
			this.warpGates.delete(gateId);
		}
	}

	/**
	 * 全ワープゲートをクリア
	 */
	public clearWarpGates(): void {
		for (const gate of this.warpGates.values()) {
			this.scene.remove(gate.group);
			gate.dispose();
		}
		this.warpGates.clear();
	}

	/**
	 * ワープ開始（アニメーション開始）
	 * 仕様: T023 warpStartedイベント受信時に呼び出し
	 */
	public startWarp(): void {
		this.isWarping = true;
		// ワープエフェクトはフロントエンド側で別途処理
	}

	/**
	 * ワープ完了・ワールド切り替え
	 * 仕様: T024 worldJoinedイベント受信時にシーンを切り替え
	 */
	public switchWorld(
		worldId: string | null,
		worldType: 'default' | 'shrine',
		spawnPosition: { x: number; y: number; z: number },
		shrineData?: { saisenBoxPosition: { x: number; y: number; z: number }; suzuPosition: { x: number; y: number; z: number }; returnGatePosition: { x: number; y: number; z: number } },
	): void {
		console.log(`[Noctown Engine] Switching to world: ${worldType} (${worldId})`);

		// 既存のワープゲートをクリア
		this.clearWarpGates();

		// 神社オブジェクトをクリア
		if (this.shrineObjects) {
			this.scene.remove(this.shrineObjects);
			this.shrineObjects = null;
		}

		// チャンクをクリア
		for (const chunk of this.chunks.values()) {
			this.scene.remove(chunk);
		}
		this.chunks.clear();

		this.currentWorldId = worldId;
		this.currentWorldType = worldType;

		if (worldType === 'shrine' && shrineData) {
			// 神社ワールドのオブジェクトを配置
			const shrineWorld = buildShrineWorld();
			this.shrineObjects = shrineWorld.scene;
			this.scene.add(this.shrineObjects);

			// 帰還用ワープゲートを配置（warp_gate.html準拠: 白色）
			this.addWarpGate({
				id: 'warp-gate-to-default',
				position: shrineData.returnGatePosition,
				targetWorldId: null, // null = デフォルトワールド
				color: 0xffffff,
			});
		} else {
			// デフォルトワールドに神社へのワープゲートを配置
			// 仕様: warp_gate.html準拠 - 白色、スポーン地点から離れた位置
			this.addWarpGate({
				id: 'warp-gate-to-shrine',
				position: { x: 10, y: 0, z: -15 },
				targetWorldId: 'shrine-world-001',
				color: 0xffffff,
			});
		}

		// プレイヤー位置を更新（カメラはanimate()内で自動追従）
		if (this.localPlayer) {
			this.localPlayer.setPosition(spawnPosition.x, spawnPosition.y, spawnPosition.z);
		}

		this.isWarping = false;
		console.log(`[Noctown Engine] World switch complete: ${worldType}`);
	}

	/**
	 * 現在のワールドタイプを取得
	 */
	public getCurrentWorldType(): 'default' | 'shrine' {
		return this.currentWorldType;
	}

	/**
	 * 現在のワールドIDを取得
	 */
	public getCurrentWorldId(): string | null {
		return this.currentWorldId;
	}

	/**
	 * ワープ中かどうか
	 */
	public getIsWarping(): boolean {
		return this.isWarping;
	}

	/**
	 * 鈴アニメーションを開始
	 * 仕様: T037 bellRingイベント受信時に呼び出し
	 */
	public startBellAnimation(): void {
		if (this.shrineObjects) {
			// 神社オブジェクト内から鈴を探す
			this.shrineObjects.traverse((child) => {
				if (child.userData.type === 'suzu') {
					this.suzuAnimationData = {
						group: child as THREE.Group,
						startTime: performance.now(),
					};
				}
			});
		}
	}

	/**
	 * ワープゲート衝突チェック（animate内で呼び出し）
	 * 仕様: T020 フレームごとにプレイヤーとゲートの衝突を判定
	 */
	private checkWarpGateCollisions(): void {
		if (this.isWarping || !this.localPlayer || !this.onWarpCollision) return;

		const playerPos = this.localPlayer.getPosition();
		for (const gate of this.warpGates.values()) {
			if (gate.checkCollision({ x: playerPos.x, z: playerPos.z })) {
				console.log(`[Noctown Engine] Warp gate collision: ${gate.config.id}`);
				this.isWarping = true; // 連続トリガー防止
				this.onWarpCollision(gate.config.id, gate.config.targetWorldId);
				break;
			}
		}
	}

	/**
	 * ワープゲートとシュラインアニメーション更新（animate内で呼び出し）
	 */
	private updateWarpGatesAndShrine(deltaTime: number): void {
		// ワープゲートアニメーション
		for (const gate of this.warpGates.values()) {
			gate.update(deltaTime);
		}

		// 鈴アニメーション
		if (this.suzuAnimationData) {
			const elapsed = (performance.now() - this.suzuAnimationData.startTime) / 1000;
			animateSuzu(this.suzuAnimationData.group, elapsed);
			// 2秒後にアニメーション終了
			if (elapsed > 2) {
				this.suzuAnimationData = null;
			}
		}
	}

	public dispose(): void {
		this.isDisposed = true;

		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
		}

		window.removeEventListener('resize', this.onResize);
		window.removeEventListener('keydown', this.onKeyDown);
		window.removeEventListener('keyup', this.onKeyUp);

		// FR-022: ペット管理のクリーンアップ
		if (this.petManager) {
			this.petManager.dispose();
			this.petManager = null;
		}

		// 仕様: 神社ワールド - ワープゲートのクリーンアップ
		this.clearWarpGates();
		if (this.shrineObjects) {
			this.scene.remove(this.shrineObjects);
			this.shrineObjects = null;
		}

		// 仕様: ドロップアイテム・設置アイテムのクリーンアップ（CSS2DObject DOM要素含む）
		this.clearItems();

		// Cleanup Three.js resources
		this.scene.traverse((object) => {
			if (object instanceof THREE.Mesh) {
				object.geometry.dispose();
				if (Array.isArray(object.material)) {
					object.material.forEach(m => m.dispose());
				} else {
					object.material.dispose();
				}
			}
		});

		this.renderer.dispose();
		this.container.removeChild(this.renderer.domElement);

		// Cleanup CSS2D renderer
		if (this.labelRenderer && this.labelRenderer.domElement.parentElement) {
			this.labelRenderer.domElement.parentElement.removeChild(this.labelRenderer.domElement);
		}
	}
}
